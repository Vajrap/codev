#!/usr/bin/env node

const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const TEMPLATES_DIR = path.join(__dirname, "templates");
const DASHBOARD_DIR = path.join(__dirname, "dashboard");
const VERSION = require("./package.json").version;
const DEFAULT_SERVE_PORT = 4173;
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
    targetDir: path.resolve(targetDir),
    port,
  };
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

  // Pre-flight checks
  if (!fs.existsSync(resolvedTarget)) {
    console.error(`\n❌ Target directory does not exist: ${resolvedTarget}\n`);
    process.exit(1);
  }

  if (
    fs.existsSync(agentsMdPath) ||
    fs.existsSync(legacyAgentMdPath) ||
    fs.existsSync(claudeMdPath) ||
    fs.existsSync(codevDirPath)
  ) {
    console.error(
      "\n⚠️  CODEV is already initialized in this directory (AGENTS.md, CLAUDE.md, AGENT.md, or codev/ exists)."
    );
    console.error(
      "   To re-initialize, remove AGENTS.md, CLAUDE.md, AGENT.md, and the codev/ folder first.\n"
    );
    process.exit(1);
  }

  // Copy templates
  console.log(`\n🚀 Initializing CODEV Framework in: ${resolvedTarget}\n`);

  fs.copyFileSync(path.join(TEMPLATES_DIR, "AGENTS.md"), agentsMdPath);
  console.log("   ✅ AGENTS.md");

  fs.copyFileSync(path.join(TEMPLATES_DIR, "CLAUDE.md"), claudeMdPath);
  console.log("   ✅ CLAUDE.md           — Claude Code bridge to AGENTS.md");

  copyDir(path.join(TEMPLATES_DIR, "codev"), codevDirPath);
  console.log("   ✅ codev/init.md          — Agent onboarding workflow");
  console.log("   ✅ codev/index.md         — Master knowledge index");
  console.log("   ✅ codev/preflight.md     — Pre-work checklist");
  console.log("   ✅ codev/templates/       — Reusable document templates");
  console.log("   ✅ codev/knowledges/      — Atomic knowledge files");
  console.log("   ✅ codev/current_ticket/  — Active task context");
  console.log("   ✅ codev/decisions/       — Architectural decision records");
  console.log("   ✅ codev/sessions/        — Agent session memory");

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ CODEV Framework initialized successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next steps:
  1. Open your AI agent (Claude, Gemini, GPT, etc.)
  2. Tell it:

     "Read AGENTS.md and initialize the project knowledge base."

  3. The agent will follow codev/init.md to scan the repo
     and populate the knowledge files automatically.
`);
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
    codev <command> [target]

  COMMANDS
    init [dir]      Initialize CODEV in a directory (default: current dir)
    serve [dir]     Serve a local CODEV dashboard (default: current dir)
    help            Show this help message
    version         Show version

  EXAMPLES
    codev init              Initialize in the current directory
    codev init ./my-app     Initialize in ./my-app
    codev init /path/to/repo
    codev serve             Open dashboard data for the current directory
    codev serve --port 4174 Use a custom dashboard port

  WORKFLOW
    1.  Run "codev init" in your project root
    2.  Tell your AI agent: "Read AGENTS.md and initialize the project"
    3.  The agent scans the repo, writes atomic knowledge docs,
        and turns AGENTS.md into a project dashboard
    4.  From then on, any new agent reads AGENTS.md first,
        follows the index, and picks up right where the last one left off
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
