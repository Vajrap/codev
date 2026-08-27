#!/usr/bin/env node

const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const TEMPLATES_DIR = path.join(__dirname, "templates");
const DASHBOARD_DIR = path.join(__dirname, "dashboard");
const VERSION = require("./package.json").version;
const DEFAULT_SERVE_PORT = 4173;
const CODEV_SCHEMA_VERSION = 1;
const CODEV_VERSION_FILE = ".version";
const AGENTS_BLOCK_START = "<!-- codev:start -->";
const AGENTS_BLOCK_END = "<!-- codev:end -->";
const AGENTS_BLOCK = `${AGENTS_BLOCK_START}
## Codev

For Codev task selection, normalize action and scope, then run \`codev route\`.
This supersedes index-first Codev routing; \`codev/index.md\` is the fallback.
Read \`codev/START.md\` only for initialization or migration.
${AGENTS_BLOCK_END}`;
const SKIPPED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".turbo",
]);

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Recursively copy a directory from src to dest.
 * Skips .gitkeep files but ensures the parent directory is created.
 */
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.name === ".gitkeep") {
      // .gitkeep only preserves empty dirs in git — skip the file itself
      continue;
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyFileIfMissing(src, dest) {
  if (fs.existsSync(dest)) {
    return false;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return true;
}

function readYamlScalar(rawValue, lineNumber) {
  const value = rawValue.trim();

  if (value === "{}") return {};
  if (value === "[]") return [];
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) return Number(value);

  if (value.startsWith('"')) {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new Error(`Invalid quoted value on line ${lineNumber}: ${error.message}`);
    }
  }

  if (value.startsWith("'")) {
    if (!value.endsWith("'") || value.length === 1) {
      throw new Error(`Unterminated quoted value on line ${lineNumber}.`);
    }
    return value.slice(1, -1).replace(/''/g, "'");
  }

  if (/^[&*!|>\[{]/.test(value) || /:\s/.test(value)) {
    throw new Error(`Unsupported YAML construct on line ${lineNumber}; quote this value if it is literal text.`);
  }

  return value;
}

/**
 * Parse the intentionally small YAML subset accepted by Codev manifests.
 * Supported constructs are indentation-based mappings, scalar lists, strings,
 * numbers, booleans, null, and empty maps/lists. Tabs, anchors, aliases, flow
 * collections with values, multiline strings, and lists of mappings are rejected.
 */
function parseCodevYaml(content) {
  const tokens = [];
  const sourceLines = String(content).replace(/^\uFEFF/, "").split(/\r?\n/);

  for (let index = 0; index < sourceLines.length; index += 1) {
    const source = sourceLines[index];
    if (/\t/.test(source)) {
      throw new Error(`Tabs are not allowed in Codev YAML (line ${index + 1}).`);
    }

    const trimmed = source.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const indent = source.length - source.trimStart().length;
    if (indent % 2 !== 0) {
      throw new Error(`Indentation must use two-space steps (line ${index + 1}).`);
    }

    tokens.push({ indent, text: trimmed, lineNumber: index + 1 });
  }

  const root = {};
  const stack = [{ indent: -2, value: root }];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    while (stack.length > 1 && stack[stack.length - 1].indent >= token.indent) {
      stack.pop();
    }

    const parentFrame = stack[stack.length - 1];
    if (token.indent !== parentFrame.indent + 2) {
      throw new Error(`Unexpected indentation on line ${token.lineNumber}.`);
    }
    const parent = parentFrame.value;

    if (token.text.startsWith("- ")) {
      if (!Array.isArray(parent)) {
        throw new Error(`List item has no list parent (line ${token.lineNumber}).`);
      }
      parent.push(readYamlScalar(token.text.slice(2), token.lineNumber));
      continue;
    }

    if (Array.isArray(parent)) {
      throw new Error(`Codev YAML lists may contain scalars only (line ${token.lineNumber}).`);
    }

    const separator = token.text.indexOf(":");
    if (separator <= 0) {
      throw new Error(`Expected a mapping entry on line ${token.lineNumber}.`);
    }

    const key = token.text.slice(0, separator).trim();
    const rawValue = token.text.slice(separator + 1).trim();
    if (!/^[A-Za-z0-9_-]+$/.test(key)) {
      throw new Error(`Invalid mapping key "${key}" on line ${token.lineNumber}.`);
    }
    if (Object.prototype.hasOwnProperty.call(parent, key)) {
      throw new Error(`Duplicate mapping key "${key}" on line ${token.lineNumber}.`);
    }

    if (rawValue) {
      parent[key] = readYamlScalar(rawValue, token.lineNumber);
      continue;
    }

    const next = tokens[index + 1];
    const container = next && next.indent > token.indent && next.text.startsWith("- ") ? [] : {};
    parent[key] = container;
    stack.push({ indent: token.indent, value: container });
  }

  return root;
}

function readCodevManifest(projectDir) {
  const manifestPath = path.join(projectDir, "codev", "manifest.yaml");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Codev manifest not found: ${manifestPath}`);
  }

  return {
    manifestPath,
    manifest: parseCodevYaml(fs.readFileSync(manifestPath, "utf8")),
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateStringList(value, field, errors, options = {}) {
  if (value === undefined && options.optional) return;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item)) {
    errors.push(`${field} must be a list of non-empty strings.`);
  }
}

function asStringList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

function validateReference(projectDir, reference, field, errors) {
  if (typeof reference !== "string" || !reference) return;
  const resolved = path.resolve(projectDir, reference);
  const relative = path.relative(projectDir, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    errors.push(`${field} must stay inside the project: ${reference}`);
  } else if (!fs.existsSync(resolved)) {
    errors.push(`${field} does not exist: ${reference}`);
  }
}

function validateManifest(projectDir, manifest) {
  const errors = [];

  if (!isPlainObject(manifest)) {
    return ["Manifest root must be a mapping."];
  }
  if (manifest.version !== CODEV_SCHEMA_VERSION) {
    errors.push(`version must be ${CODEV_SCHEMA_VERSION}.`);
  }
  if (!isPlainObject(manifest.project) || typeof manifest.project.name !== "string") {
    errors.push("project.name must be a string.");
  }
  if (!isPlainObject(manifest.bootstrap)) {
    errors.push("bootstrap must be a mapping.");
  } else {
    if (typeof manifest.bootstrap.status !== "string") {
      errors.push("bootstrap.status must be a string.");
    }
    if (typeof manifest.bootstrap.entry !== "string") {
      errors.push("bootstrap.entry must be a string.");
    } else {
      validateReference(projectDir, manifest.bootstrap.entry, "bootstrap.entry", errors);
    }
  }

  if (!isPlainObject(manifest.routing) || !isPlainObject(manifest.routing.fallback)) {
    errors.push("routing.fallback must be a mapping.");
  } else {
    validateStringList(manifest.routing.fallback.knowledge, "routing.fallback.knowledge", errors);
    for (const reference of asStringList(manifest.routing.fallback.knowledge)) {
      validateReference(projectDir, reference, "routing.fallback.knowledge", errors);
    }
  }

  if (!isPlainObject(manifest.routes)) {
    errors.push("routes must be a mapping.");
    return errors;
  }

  for (const [routeId, route] of Object.entries(manifest.routes)) {
    const field = `routes.${routeId}`;
    if (!isPlainObject(route)) {
      errors.push(`${field} must be a mapping.`);
      continue;
    }
    if (route.priority !== undefined && !Number.isInteger(route.priority)) {
      errors.push(`${field}.priority must be an integer.`);
    }
    if (!isPlainObject(route.when)) {
      errors.push(`${field}.when must be a mapping.`);
    } else {
      validateStringList(route.when.actions, `${field}.when.actions`, errors, { optional: true });
      validateStringList(route.when.scopes, `${field}.when.scopes`, errors, { optional: true });
      validateStringList(route.when.paths, `${field}.when.paths`, errors, { optional: true });
    }
    if (!isPlainObject(route.load)) {
      errors.push(`${field}.load must be a mapping.`);
    } else {
      for (const loadField of ["skills", "knowledge", "state"]) {
        validateStringList(route.load[loadField], `${field}.load.${loadField}`, errors, { optional: true });
      }
      for (const reference of [
        ...asStringList(route.load.knowledge),
        ...asStringList(route.load.state),
      ]) {
        validateReference(projectDir, reference, `${field}.load`, errors);
      }
      for (const skill of asStringList(route.load.skills)) {
        if (!/^[a-z0-9][a-z0-9-]*$/.test(skill)) {
          errors.push(`${field}.load.skills must use lowercase kebab-case IDs: ${skill}`);
          continue;
        }
        const skillPath = path.join(projectDir, ".agents", "skills", skill, "SKILL.md");
        if (!fs.existsSync(skillPath)) {
          errors.push(`${field}.load.skills does not exist: .agents/skills/${skill}/SKILL.md`);
        }
      }
    }
    if (route.enforce !== undefined) {
      if (!isPlainObject(route.enforce)) {
        errors.push(`${field}.enforce must be a mapping.`);
      } else {
        validateStringList(route.enforce.guardrails, `${field}.enforce.guardrails`, errors, { optional: true });
        for (const reference of asStringList(route.enforce.guardrails)) {
          validateReference(projectDir, reference, `${field}.enforce.guardrails`, errors);
        }
        if (route.enforce.verification !== undefined && typeof route.enforce.verification !== "string") {
          errors.push(`${field}.enforce.verification must be a string.`);
        }
      }
    }
  }

  return errors;
}

function globMatches(pattern, candidate) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "\u0000")
    .replace(/\*/g, "[^/]*")
    .replace(/\u0000/g, ".*");
  return new RegExp(`^${escaped}$`).test(candidate.replace(/\\/g, "/"));
}

function uniqueStrings(values) {
  return [...new Set(values)];
}

function resolveRoutes(manifest, input) {
  const matched = Object.entries(manifest.routes)
    .filter(([, route]) => {
      const when = route.when || {};
      if (when.actions && !when.actions.includes(input.action)) return false;
      if (when.scopes && !when.scopes.includes(input.scope)) return false;
      if (when.paths) {
        if (input.paths.length === 0) return false;
        if (!when.paths.some((pattern) => input.paths.some((candidate) => globMatches(pattern, candidate)))) {
          return false;
        }
      }
      return true;
    })
    .map(([id, route]) => ({ id, ...route }))
    .sort((left, right) => (right.priority || 0) - (left.priority || 0) || left.id.localeCompare(right.id));

  const fallback = manifest.routing.fallback;
  const selected = matched.length > 0 ? matched : [];

  return {
    input,
    matched_routes: selected.map((route) => ({
      id: route.id,
      priority: route.priority || 0,
      matched_on: {
        actions: route.when.actions || [],
        scopes: route.when.scopes || [],
        paths: route.when.paths || [],
      },
    })),
    fallback_used: selected.length === 0,
    load: {
      skills: uniqueStrings(selected.flatMap((route) => route.load.skills || [])),
      knowledge: uniqueStrings(
        selected.length > 0
          ? selected.flatMap((route) => route.load.knowledge || [])
          : fallback.knowledge || []
      ),
      state: uniqueStrings(selected.flatMap((route) => route.load.state || [])),
    },
    enforce: {
      guardrails: uniqueStrings(selected.flatMap((route) => route.enforce?.guardrails || [])),
      verification: uniqueStrings(
        selected.map((route) => route.enforce?.verification).filter(Boolean)
      ),
    },
  };
}

function parseServeArgs(args) {
  let targetDir = process.cwd();
  let port = DEFAULT_SERVE_PORT;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--port" || arg === "-p") {
      const value = args[i + 1];
      const parsed = Number(value);
      if (!value || !Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
        console.error(`\n❌ Invalid port: ${value || "(missing)"}\n`);
        process.exit(1);
      }
      port = parsed;
      i += 1;
    } else {
      targetDir = arg;
    }
  }

  return {
    targetDir: resolveCodevServeRoot(path.resolve(targetDir)),
    port,
  };
}

function resolveCodevServeRoot(targetDir) {
  const codevDir = path.join(targetDir, "codev");

  if (!fs.existsSync(codevDir)) {
    return targetDir;
  }

  if (fs.statSync(codevDir).isDirectory()) {
    return codevDir;
  }

  return targetDir;
}

function resolveInsideRoot(rootDir, requestedPath = "") {
  const decodedPath = String(requestedPath).replace(/^[/\\]+/, "");
  const resolved = path.resolve(rootDir, decodedPath);
  const relative = path.relative(rootDir, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  return {
    absolutePath: resolved,
    relativePath: relative === "" ? "." : relative,
  };
}

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendText(res, statusCode, body, contentType) {
  res.writeHead(statusCode, {
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readJsonBody(req, callback) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 2 * 1024 * 1024) {
      req.destroy();
    }
  });

  req.on("end", () => {
    try {
      callback(null, JSON.parse(body || "{}"));
    } catch (error) {
      callback(error);
    }
  });
}

function scanDirectory(rootDir, requestedPath) {
  const resolved = resolveInsideRoot(rootDir, requestedPath);
  if (!resolved) {
    return { status: 400, error: "Path must stay inside the served project." };
  }

  if (!fs.existsSync(resolved.absolutePath)) {
    return { status: 404, error: "Folder not found." };
  }

  const stat = fs.statSync(resolved.absolutePath);
  if (!stat.isDirectory()) {
    return { status: 400, error: "Path is not a folder." };
  }

  const entries = fs.readdirSync(resolved.absolutePath, { withFileTypes: true });
  const directories = [];
  const markdownFiles = [];

  for (const entry of entries) {
    const childRelativePath =
      resolved.relativePath === "."
        ? entry.name
        : path.join(resolved.relativePath, entry.name);

    if (entry.isDirectory()) {
      if (!SKIPPED_DIRS.has(entry.name)) {
        directories.push({
          name: entry.name,
          path: childRelativePath,
        });
      }
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      markdownFiles.push({
        name: entry.name,
        path: childRelativePath,
      });
    }
  }

  directories.sort((a, b) => a.name.localeCompare(b.name));
  markdownFiles.sort((a, b) => a.name.localeCompare(b.name));

  const parentPath =
    resolved.relativePath === "." ? null : path.dirname(resolved.relativePath);

  return {
    status: 200,
    data: {
      root: rootDir,
      currentPath: resolved.relativePath,
      parentPath: parentPath === "." ? "." : parentPath,
      directories,
      markdownFiles,
    },
  };
}

function readMarkdownFile(rootDir, requestedPath) {
  const resolved = resolveInsideRoot(rootDir, requestedPath);
  if (!resolved) {
    return { status: 400, error: "Path must stay inside the served project." };
  }

  if (!resolved.absolutePath.toLowerCase().endsWith(".md")) {
    return { status: 400, error: "Only Markdown files can be opened." };
  }

  if (!fs.existsSync(resolved.absolutePath)) {
    return { status: 404, error: "Markdown file not found." };
  }

  const stat = fs.statSync(resolved.absolutePath);
  if (!stat.isFile()) {
    return { status: 400, error: "Path is not a file." };
  }

  return {
    status: 200,
    data: {
      path: resolved.relativePath,
      content: fs.readFileSync(resolved.absolutePath, "utf8"),
    },
  };
}

function writeMarkdownFile(rootDir, requestedPath, content) {
  const resolved = resolveInsideRoot(rootDir, requestedPath);
  if (!resolved) {
    return { status: 400, error: "Path must stay inside the served project." };
  }

  if (!resolved.absolutePath.toLowerCase().endsWith(".md")) {
    return { status: 400, error: "Only Markdown files can be saved." };
  }

  if (!fs.existsSync(resolved.absolutePath)) {
    return { status: 404, error: "Markdown file not found." };
  }

  const stat = fs.statSync(resolved.absolutePath);
  if (!stat.isFile()) {
    return { status: 400, error: "Path is not a file." };
  }

  fs.writeFileSync(resolved.absolutePath, String(content), "utf8");

  return {
    status: 200,
    data: {
      path: resolved.relativePath,
      saved: true,
    },
  };
}

function serveStaticFile(res, filePath, contentType) {
  if (!fs.existsSync(filePath)) {
    sendJson(res, 404, { error: "Asset not found." });
    return;
  }

  sendText(res, 200, fs.readFileSync(filePath), contentType);
}

// ── Commands ─────────────────────────────────────────────────────────

function cmdInit(targetDir) {
  const resolvedTarget = path.resolve(targetDir);
  const agentsMdPath = path.join(resolvedTarget, "AGENTS.md");
  const legacyAgentMdPath = path.join(resolvedTarget, "AGENT.md");
  const claudeMdPath = path.join(resolvedTarget, "CLAUDE.md");
  const codevDirPath = path.join(resolvedTarget, "codev");
  const manifestPath = path.join(codevDirPath, "manifest.yaml");

  if (!fs.existsSync(resolvedTarget)) {
    console.error(`\n❌ Target directory does not exist: ${resolvedTarget}\n`);
    process.exit(1);
  }

  if (!fs.statSync(resolvedTarget).isDirectory()) {
    console.error(`\n❌ Target is not a directory: ${resolvedTarget}\n`);
    process.exit(1);
  }

  if (fs.existsSync(manifestPath)) {
    console.log(`\n✅ CODEV is already initialized in: ${resolvedTarget}`);
    console.log("   Existing project and agent instructions were left unchanged.\n");
    return;
  }

  if (fs.existsSync(codevDirPath)) {
    console.error(
      `\n⚠️  A codev/ directory already exists without a v${CODEV_SCHEMA_VERSION} manifest.`
    );
    console.error(
      "   Its ownership is ambiguous, so nothing was changed. Run \"codev upgrade\" if this is an older Codev installation.\n"
    );
    process.exit(1);
  }

  console.log(`\n🚀 Initializing CODEV Framework in: ${resolvedTarget}\n`);
  copyDir(path.join(TEMPLATES_DIR, "codev"), codevDirPath);
  fs.writeFileSync(path.join(codevDirPath, CODEV_VERSION_FILE), `${VERSION}\n`, "utf8");

  console.log("   ✅ codev/START.md       — Agent-driven bootstrap workflow");
  console.log("   ✅ codev/manifest.yaml  — Deterministic routing declaration");
  console.log("   ✅ codev/               — Knowledge, decisions, tickets, and templates");

  const preserved = [
    [agentsMdPath, "AGENTS.md"],
    [legacyAgentMdPath, "AGENT.md"],
    [claudeMdPath, "CLAUDE.md"],
  ].filter(([filePath]) => fs.existsSync(filePath));

  for (const [, label] of preserved) {
    console.log(`   ↪ ${label} preserved unchanged`);
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ CODEV Framework initialized successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next steps:
  1. Open your AI agent (Claude, Gemini, GPT, etc.)
  2. Tell it:

     "Read codev/START.md and initialize Codev for this project.
      Preserve the existing agent instructions."

  3. Optionally run "codev integrate agents" after reviewing
     the managed AGENTS.md adapter block.
`);
}

function cmdUpgrade(targetDir) {
  const resolvedTarget = path.resolve(targetDir);
  const codevDirPath = path.join(resolvedTarget, "codev");

  if (!fs.existsSync(codevDirPath) || !fs.statSync(codevDirPath).isDirectory()) {
    console.error(`\n❌ No existing codev/ directory found in: ${resolvedTarget}`);
    console.error("   Run \"codev init\" for a new installation.\n");
    process.exit(1);
  }

  const additions = [
    ["START.md", "bootstrap entry"],
    ["manifest.yaml", "routing manifest"],
  ];
  const created = [];

  for (const [relativePath, description] of additions) {
    const didCopy = copyFileIfMissing(
      path.join(TEMPLATES_DIR, "codev", relativePath),
      path.join(codevDirPath, relativePath)
    );
    if (didCopy) created.push(`${relativePath} (${description})`);
  }

  fs.writeFileSync(path.join(codevDirPath, CODEV_VERSION_FILE), `${VERSION}\n`, "utf8");

  console.log(`\n✅ CODEV upgraded in: ${resolvedTarget}`);
  if (created.length > 0) {
    for (const item of created) console.log(`   + codev/${item}`);
  } else {
    console.log("   No additive files were needed.");
  }
  console.log("   Existing knowledge and root agent instructions were preserved.");
  console.log("   Run \"codev validate\" to verify the routing contract.\n");
}

function parseProjectOption(args) {
  let projectDir = process.cwd();
  const remaining = [];

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--project") {
      if (!args[index + 1]) {
        throw new Error("--project requires a directory.");
      }
      projectDir = args[index + 1];
      index += 1;
    } else {
      remaining.push(args[index]);
    }
  }

  return { projectDir: path.resolve(projectDir), remaining };
}

function replaceManagedAgentsBlock(content) {
  const start = content.indexOf(AGENTS_BLOCK_START);
  const end = content.indexOf(AGENTS_BLOCK_END);

  if (
    (start === -1) !== (end === -1) ||
    (start !== -1 && end < start) ||
    (start !== -1 && content.lastIndexOf(AGENTS_BLOCK_START) !== start) ||
    (end !== -1 && content.lastIndexOf(AGENTS_BLOCK_END) !== end)
  ) {
    throw new Error("AGENTS.md contains an incomplete or malformed Codev managed block.");
  }

  if (start === -1) {
    return content ? `${content}\n\n${AGENTS_BLOCK}\n` : `${AGENTS_BLOCK}\n`;
  }

  const afterEnd = end + AGENTS_BLOCK_END.length;
  return `${content.slice(0, start)}${AGENTS_BLOCK}${content.slice(afterEnd)}`;
}

function removeManagedAgentsBlock(content) {
  const start = content.indexOf(AGENTS_BLOCK_START);
  const end = content.indexOf(AGENTS_BLOCK_END);
  if (start === -1 && end === -1) return content;
  if (
    start === -1 ||
    end === -1 ||
    end < start ||
    content.lastIndexOf(AGENTS_BLOCK_START) !== start ||
    content.lastIndexOf(AGENTS_BLOCK_END) !== end
  ) {
    throw new Error("AGENTS.md contains an incomplete or malformed Codev managed block.");
  }

  const afterEnd = end + AGENTS_BLOCK_END.length;
  const separatorStart = start >= 2 && content.slice(start - 2, start) === "\n\n" ? start - 2 : start;
  const after = content.startsWith("\n", afterEnd) ? afterEnd + 1 : afterEnd;
  return `${content.slice(0, separatorStart)}${content.slice(after)}`;
}

function cmdIntegrate(args) {
  if (args[0] !== "agents") {
    console.error('\n❌ Usage: codev integrate agents [--project dir] [--check|--remove]\n');
    process.exit(1);
  }

  let parsed;
  try {
    parsed = parseProjectOption(args.slice(1));
  } catch (error) {
    console.error(`\n❌ ${error.message}\n`);
    process.exit(1);
  }

  const check = parsed.remaining.includes("--check");
  const remove = parsed.remaining.includes("--remove");
  if (check && remove) {
    console.error("\n❌ Choose either --check or --remove.\n");
    process.exit(1);
  }
  if (parsed.remaining.some((arg) => arg !== "--check" && arg !== "--remove")) {
    console.error(`\n❌ Unknown integrate option: ${parsed.remaining.join(" ")}\n`);
    process.exit(1);
  }

  if (!remove && !fs.existsSync(path.join(parsed.projectDir, "codev", "manifest.yaml"))) {
    console.error("\n❌ Codev is not initialized in this project. Run \"codev init\" first.\n");
    process.exit(1);
  }

  const agentsPath = path.join(parsed.projectDir, "AGENTS.md");
  const current = fs.existsSync(agentsPath) ? fs.readFileSync(agentsPath, "utf8") : "";

  try {
    if (check) {
      const expected = replaceManagedAgentsBlock(current);
      if (!fs.existsSync(agentsPath) || expected !== current) {
        console.error("\n❌ AGENTS.md does not contain the current Codev managed block.\n");
        process.exit(1);
      }
      console.log("\n✅ AGENTS.md contains the current Codev managed block.\n");
      return;
    }

    const next = remove ? removeManagedAgentsBlock(current) : replaceManagedAgentsBlock(current);
    if (next === current) {
      console.log(`\n✅ AGENTS.md Codev integration is already ${remove ? "absent" : "current"}.\n`);
      return;
    }

    if (remove && !next && current.trim() === AGENTS_BLOCK) {
      fs.unlinkSync(agentsPath);
    } else {
      fs.writeFileSync(agentsPath, next, "utf8");
    }
    console.log(`\n✅ ${remove ? "Removed" : "Updated"} only the Codev managed block in AGENTS.md.\n`);
  } catch (error) {
    console.error(`\n❌ ${error.message}\n`);
    process.exit(1);
  }
}

function cmdValidate(args) {
  let parsed;
  try {
    parsed = parseProjectOption(args);
    if (parsed.remaining.length > 0) {
      throw new Error(`Unknown validate option: ${parsed.remaining.join(" ")}`);
    }
    const { manifestPath, manifest } = readCodevManifest(parsed.projectDir);
    const errors = validateManifest(parsed.projectDir, manifest);
    if (errors.length > 0) {
      console.error(`\n❌ Invalid Codev manifest: ${manifestPath}`);
      for (const error of errors) console.error(`   - ${error}`);
      console.error("");
      process.exit(1);
    }
    console.log(`\n✅ Valid Codev manifest: ${manifestPath}\n`);
  } catch (error) {
    console.error(`\n❌ ${error.message}\n`);
    process.exit(1);
  }
}

function parseRouteArgs(args) {
  const parsed = parseProjectOption(args);
  const input = { action: null, scope: null, paths: [] };
  let json = false;

  for (let index = 0; index < parsed.remaining.length; index += 1) {
    const arg = parsed.remaining[index];
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (arg === "--explain") {
      continue;
    }
    if (arg === "--action" || arg === "--scope" || arg === "--path") {
      const value = parsed.remaining[index + 1];
      if (!value) throw new Error(`${arg} requires a value.`);
      if (arg === "--action") input.action = value;
      if (arg === "--scope") input.scope = value;
      if (arg === "--path") {
        const slashed = value.replace(/\\/g, "/");
        const normalized = path.posix.normalize(slashed).replace(/^\.\//, "");
        if (
          path.isAbsolute(value) ||
          path.posix.isAbsolute(normalized) ||
          normalized === ".." ||
          normalized.startsWith("../")
        ) {
          throw new Error("--path values must be project-relative and stay inside the project.");
        }
        input.paths.push(normalized);
      }
      index += 1;
      continue;
    }
    throw new Error(`Unknown route option: ${arg}`);
  }

  if (!input.action || !input.scope) {
    throw new Error("route requires explicit --action and --scope values.");
  }

  return { projectDir: parsed.projectDir, input, json };
}

function printRoutePlan(plan) {
  console.log("\nCODEV route plan");
  console.log(`  action: ${plan.input.action}`);
  console.log(`  scope: ${plan.input.scope}`);
  console.log(`  paths: ${plan.input.paths.length > 0 ? plan.input.paths.join(", ") : "(none)"}`);
  console.log(
    `  routes: ${plan.matched_routes.length > 0 ? plan.matched_routes.map((route) => route.id).join(", ") : "fallback"}`
  );

  for (const [label, values] of Object.entries({
    skills: plan.load.skills,
    knowledge: plan.load.knowledge,
    state: plan.load.state,
    guardrails: plan.enforce.guardrails,
    verification: plan.enforce.verification,
  })) {
    console.log(`  ${label}:`);
    if (values.length === 0) console.log("    - (none)");
    for (const value of values) console.log(`    - ${value}`);
  }
  console.log("");
}

function cmdRoute(args) {
  try {
    const parsed = parseRouteArgs(args);
    const { manifestPath, manifest } = readCodevManifest(parsed.projectDir);
    const errors = validateManifest(parsed.projectDir, manifest);
    if (errors.length > 0) {
      throw new Error(`Manifest validation failed; run "codev validate". First error: ${errors[0]}`);
    }
    const plan = resolveRoutes(manifest, parsed.input);
    plan.manifest = manifestPath;
    if (parsed.json) {
      console.log(JSON.stringify(plan, null, 2));
    } else {
      printRoutePlan(plan);
    }
  } catch (error) {
    console.error(`\n❌ ${error.message}\n`);
    process.exit(1);
  }
}

function cmdHelp() {
  console.log(`
  ██████╗ ██████╗ ██████╗ ███████╗██╗   ██╗
 ██╔════╝██╔═══██╗██╔══██╗██╔════╝██║   ██║
 ██║     ██║   ██║██║  ██║█████╗  ██║   ██║
 ██║     ██║   ██║██║  ██║██╔══╝  ╚██╗ ██╔╝
 ╚██████╗╚██████╔╝██████╔╝███████╗ ╚████╔╝
  ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝  ╚═══╝  v${VERSION}

  AI-agent-friendly project knowledge scaffolding.

  USAGE
    codev <command> [options]

  COMMANDS
    init [dir]             Install CODEV without changing root agent files
    upgrade [dir]          Add the current contract to an older CODEV project
    integrate agents       Manage the marked CODEV block in AGENTS.md
    validate               Validate codev/manifest.yaml and its references
    route                  Resolve explicit task inputs into a load plan
    serve [dir]            Serve a local CODEV dashboard
    help                   Show this help message
    version                Show version

  EXAMPLES
    codev init              Initialize in the current directory
    codev init ./my-app     Initialize in ./my-app
    codev upgrade ./my-app  Upgrade an existing CODEV knowledge base
    codev integrate agents --project ./my-app
    codev integrate agents --project ./my-app --check
    codev validate --project ./my-app
    codev route --action implement --scope backend --path server/auth.js
    codev route --action implement --scope backend --explain
    codev route --action review --scope project --json
    codev serve             Open dashboard data for the current CODEV folder
    codev serve --port 4174 Use a custom dashboard port

  WORKFLOW
    1.  Run "codev init" in your project root
    2.  Tell your agent: "Read codev/START.md and initialize Codev"
    3.  The agent proposes normalized routes and focused project knowledge
    4.  Use "codev integrate agents" only when you want the root adapter
    5.  Resolve explicit task action and scope through "codev route"
`);
}

function cmdServe(args) {
  const { targetDir, port } = parseServeArgs(args);

  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
    console.error(`\n❌ Target directory does not exist: ${targetDir}\n`);
    process.exit(1);
  }

  const server = http.createServer((req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && requestUrl.pathname === "/") {
      serveStaticFile(res, path.join(DASHBOARD_DIR, "index.html"), "text/html; charset=utf-8");
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/assets/style.css") {
      serveStaticFile(res, path.join(DASHBOARD_DIR, "style.css"), "text/css; charset=utf-8");
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/assets/app.js") {
      serveStaticFile(res, path.join(DASHBOARD_DIR, "app.js"), "text/javascript; charset=utf-8");
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/scan") {
      const result = scanDirectory(targetDir, requestUrl.searchParams.get("path") || ".");
      if (result.error) {
        sendJson(res, result.status, { error: result.error });
      } else {
        sendJson(res, result.status, result.data);
      }
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/file") {
      const result = readMarkdownFile(targetDir, requestUrl.searchParams.get("path") || "");
      if (result.error) {
        sendJson(res, result.status, { error: result.error });
      } else {
        sendJson(res, result.status, result.data);
      }
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/file") {
      readJsonBody(req, (error, body) => {
        if (error) {
          sendJson(res, 400, { error: "Request body must be valid JSON." });
          return;
        }

        const result = writeMarkdownFile(targetDir, body.path || "", body.content || "");
        if (result.error) {
          sendJson(res, result.status, { error: result.error });
        } else {
          sendJson(res, result.status, result.data);
        }
      });
      return;
    }

    sendJson(res, 404, { error: "Not found." });
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(`\nCODEV dashboard serving: ${targetDir}`);
    console.log(`Open: http://127.0.0.1:${port}\n`);
  });
}

// ── Main ─────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";

  switch (command) {
    case "init":
      cmdInit(args[1] || process.cwd());
      break;

    case "upgrade":
      cmdUpgrade(args[1] || process.cwd());
      break;

    case "integrate":
      cmdIntegrate(args.slice(1));
      break;

    case "validate":
      cmdValidate(args.slice(1));
      break;

    case "route":
      cmdRoute(args.slice(1));
      break;

    case "serve":
      cmdServe(args.slice(1));
      break;

    case "version":
    case "--version":
    case "-v":
      console.log(`codev v${VERSION}`);
      break;

    case "help":
    case "--help":
    case "-h":
    default:
      cmdHelp();
      break;
  }
}

main();
