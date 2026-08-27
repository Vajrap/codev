const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const CLI_PATH = path.resolve(__dirname, "..", "index.js");

function makeProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "codev-test-"));
}

function runCodev(args, cwd) {
  return spawnSync(process.execPath, [CLI_PATH, ...args], {
    cwd,
    encoding: "utf8",
  });
}

function writeFile(projectDir, relativePath, content) {
  const filePath = path.join(projectDir, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

test("init preserves existing root agent instructions", () => {
  const projectDir = makeProject();
  writeFile(projectDir, "AGENTS.md", "# Existing rules\n");
  writeFile(projectDir, "CLAUDE.md", "# Existing Claude rules\n");

  const result = runCodev(["init", projectDir], projectDir);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(path.join(projectDir, "AGENTS.md"), "utf8"), "# Existing rules\n");
  assert.equal(fs.readFileSync(path.join(projectDir, "CLAUDE.md"), "utf8"), "# Existing Claude rules\n");
  assert.ok(fs.existsSync(path.join(projectDir, "codev", "START.md")));
  assert.ok(fs.existsSync(path.join(projectDir, "codev", "manifest.yaml")));
  assert.match(result.stdout, /AGENTS\.md preserved unchanged/);
});

test("init does not claim root agent files in a fresh project", () => {
  const projectDir = makeProject();

  const result = runCodev(["init", projectDir], projectDir);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(projectDir, "AGENTS.md")), false);
  assert.equal(fs.existsSync(path.join(projectDir, "CLAUDE.md")), false);
});

test("init is an idempotent no-op for a manifest-based installation", () => {
  const projectDir = makeProject();
  assert.equal(runCodev(["init", projectDir], projectDir).status, 0);
  const startBefore = fs.readFileSync(path.join(projectDir, "codev", "START.md"), "utf8");

  const second = runCodev(["init", projectDir], projectDir);

  assert.equal(second.status, 0, second.stderr);
  assert.match(second.stdout, /already initialized/);
  assert.equal(fs.readFileSync(path.join(projectDir, "codev", "START.md"), "utf8"), startBefore);
});

test("init refuses an unrecognized codev directory", () => {
  const projectDir = makeProject();
  writeFile(projectDir, "codev/unrelated.txt", "owned elsewhere\n");

  const result = runCodev(["init", projectDir], projectDir);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /ownership is ambiguous/);
  assert.equal(fs.existsSync(path.join(projectDir, "codev", "START.md")), false);
});

test("upgrade adds the v0.2 contract without overwriting legacy knowledge", () => {
  const projectDir = makeProject();
  writeFile(projectDir, "codev/index.md", "# Legacy index\n");
  writeFile(projectDir, "codev/init.md", "# Legacy init\n");
  writeFile(projectDir, "AGENTS.md", "# Existing rules\n");

  const result = runCodev(["upgrade", projectDir], projectDir);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(path.join(projectDir, "codev", "index.md"), "utf8"), "# Legacy index\n");
  assert.equal(fs.readFileSync(path.join(projectDir, "codev", "init.md"), "utf8"), "# Legacy init\n");
  assert.equal(fs.readFileSync(path.join(projectDir, "AGENTS.md"), "utf8"), "# Existing rules\n");
  assert.ok(fs.existsSync(path.join(projectDir, "codev", "START.md")));
  assert.ok(fs.existsSync(path.join(projectDir, "codev", "manifest.yaml")));
});

test("AGENTS integration is marked, idempotent, checkable, and removable", () => {
  const projectDir = makeProject();
  const original = "# Existing rules  \n\nKeep this.  ";
  writeFile(projectDir, "AGENTS.md", original);
  assert.equal(runCodev(["init", projectDir], projectDir).status, 0);

  const first = runCodev(["integrate", "agents", "--project", projectDir], projectDir);
  assert.equal(first.status, 0, first.stderr);
  const integrated = fs.readFileSync(path.join(projectDir, "AGENTS.md"), "utf8");
  assert.match(integrated, /# Existing rules/);
  assert.match(integrated, /<!-- codev:start -->/);

  const second = runCodev(["integrate", "agents", "--project", projectDir], projectDir);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(fs.readFileSync(path.join(projectDir, "AGENTS.md"), "utf8"), integrated);

  const check = runCodev(["integrate", "agents", "--project", projectDir, "--check"], projectDir);
  assert.equal(check.status, 0, check.stderr);

  const remove = runCodev(["integrate", "agents", "--project", projectDir, "--remove"], projectDir);
  assert.equal(remove.status, 0, remove.stderr);
  assert.equal(fs.readFileSync(path.join(projectDir, "AGENTS.md"), "utf8"), original);
});

test("AGENTS integration creates and removes a block-only adapter", () => {
  const projectDir = makeProject();
  assert.equal(runCodev(["init", projectDir], projectDir).status, 0);

  assert.equal(runCodev(["integrate", "agents", "--project", projectDir], projectDir).status, 0);
  assert.ok(fs.existsSync(path.join(projectDir, "AGENTS.md")));

  const remove = runCodev(["integrate", "agents", "--project", projectDir, "--remove"], projectDir);
  assert.equal(remove.status, 0, remove.stderr);
  assert.equal(fs.existsSync(path.join(projectDir, "AGENTS.md")), false);
});

test("AGENTS integration refuses malformed markers", () => {
  const projectDir = makeProject();
  writeFile(projectDir, "AGENTS.md", "# Rules\n\n<!-- codev:start -->\n");
  assert.equal(runCodev(["init", projectDir], projectDir).status, 0);

  const result = runCodev(["integrate", "agents", "--project", projectDir], projectDir);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /incomplete or malformed/);
  assert.equal(fs.readFileSync(path.join(projectDir, "AGENTS.md"), "utf8"), "# Rules\n\n<!-- codev:start -->\n");
});

test("AGENTS integration refuses duplicate managed blocks", () => {
  const projectDir = makeProject();
  assert.equal(runCodev(["init", projectDir], projectDir).status, 0);
  writeFile(
    projectDir,
    "AGENTS.md",
    "<!-- codev:start -->\n<!-- codev:end -->\n<!-- codev:start -->\n<!-- codev:end -->\n"
  );

  const result = runCodev(["integrate", "agents", "--project", projectDir, "--check"], projectDir);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /incomplete or malformed/);
});

test("AGENTS integration does not create a dangling adapter before init", () => {
  const projectDir = makeProject();

  const result = runCodev(["integrate", "agents", "--project", projectDir], projectDir);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /not initialized/);
  assert.equal(fs.existsSync(path.join(projectDir, "AGENTS.md")), false);
});

test("validate accepts the scaffold manifest and rejects missing references", () => {
  const projectDir = makeProject();
  assert.equal(runCodev(["init", projectDir], projectDir).status, 0);

  const valid = runCodev(["validate", "--project", projectDir], projectDir);
  assert.equal(valid.status, 0, valid.stderr);

  const manifestPath = path.join(projectDir, "codev", "manifest.yaml");
  const manifest = fs.readFileSync(manifestPath, "utf8").replace(
    "routes: {}",
    [
      "routes:",
      "  broken-route:",
      "    when:",
      "      actions:",
      "        - implement",
      "    load:",
      "      knowledge:",
      "        - codev/knowledges/missing.md",
    ].join("\n")
  );
  fs.writeFileSync(manifestPath, manifest, "utf8");

  const invalid = runCodev(["validate", "--project", projectDir], projectDir);
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /does not exist/);
});

test("validate rejects unsupported YAML rather than interpreting it loosely", () => {
  const projectDir = makeProject();
  assert.equal(runCodev(["init", projectDir], projectDir).status, 0);
  const manifestPath = path.join(projectDir, "codev", "manifest.yaml");
  fs.writeFileSync(manifestPath, "version: &shared 1\n", "utf8");

  const result = runCodev(["validate", "--project", projectDir], projectDir);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unsupported YAML construct/);
});

test("validate rejects unterminated single-quoted YAML", () => {
  const projectDir = makeProject();
  assert.equal(runCodev(["init", projectDir], projectDir).status, 0);
  const manifestPath = path.join(projectDir, "codev", "manifest.yaml");
  fs.writeFileSync(manifestPath, "version: '1\n", "utf8");

  const result = runCodev(["validate", "--project", projectDir], projectDir);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unterminated quoted value/);
});

test("route requires normalized inputs and project-relative paths", () => {
  const projectDir = makeProject();
  assert.equal(runCodev(["init", projectDir], projectDir).status, 0);

  const missingScope = runCodev(["route", "--project", projectDir, "--action", "review"], projectDir);
  assert.equal(missingScope.status, 1);
  assert.match(missingScope.stderr, /explicit --action and --scope/);

  const escapedPath = runCodev(
    ["route", "--project", projectDir, "--action", "review", "--scope", "project", "--path", "foo/../../secret"],
    projectDir
  );
  assert.equal(escapedPath.status, 1);
  assert.match(escapedPath.stderr, /project-relative/);
});

test("route deterministically composes matches by priority and uses fallback", () => {
  const projectDir = makeProject();
  writeFile(projectDir, "codev/START.md", "# Start\n");
  writeFile(projectDir, "codev/index.md", "# Index\n");
  writeFile(projectDir, "codev/guardrails.md", "# Guardrails\n");
  writeFile(projectDir, "codev/knowledges/backend.md", "# Backend\n");
  writeFile(projectDir, "codev/knowledges/testing.md", "# Testing\n");
  writeFile(
    projectDir,
    "codev/manifest.yaml",
    [
      "version: 1",
      "project:",
      "  name: fixture",
      "bootstrap:",
      "  status: complete",
      "  entry: codev/START.md",
      "routing:",
      "  fallback:",
      "    knowledge:",
      "      - codev/index.md",
      "routes:",
      "  backend:",
      "    priority: 100",
      "    when:",
      "      actions:",
      "        - implement",
      "      scopes:",
      "        - backend",
      "    load:",
      "      knowledge:",
      "        - codev/knowledges/backend.md",
      "    enforce:",
      "      guardrails:",
      "        - codev/guardrails.md",
      "      verification: focused-tests",
      "  tests:",
      "    priority: 50",
      "    when:",
      "      actions:",
      "        - implement",
      "      scopes:",
      "        - backend",
      "      paths:",
      "        - server/**",
      "    load:",
      "      knowledge:",
      "        - codev/knowledges/testing.md",
      "",
    ].join("\n")
  );

  const args = [
    "route",
    "--project",
    projectDir,
    "--action",
    "implement",
    "--scope",
    "backend",
    "--path",
    "server/auth.js",
    "--json",
  ];
  const first = runCodev(args, projectDir);
  const second = runCodev(args, projectDir);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(first.stdout, second.stdout);

  const plan = JSON.parse(first.stdout);
  assert.deepEqual(plan.matched_routes.map((route) => route.id), ["backend", "tests"]);
  assert.deepEqual(plan.load.knowledge, [
    "codev/knowledges/backend.md",
    "codev/knowledges/testing.md",
  ]);

  const fallback = runCodev(
    ["route", "--project", projectDir, "--action", "review", "--scope", "frontend", "--json"],
    projectDir
  );
  assert.equal(fallback.status, 0, fallback.stderr);
  assert.equal(JSON.parse(fallback.stdout).fallback_used, true);
  assert.deepEqual(JSON.parse(fallback.stdout).load.knowledge, ["codev/index.md"]);
});
