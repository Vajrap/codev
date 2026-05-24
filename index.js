#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const TEMPLATES_DIR = path.join(__dirname, "templates");
const VERSION = require("./package.json").version;

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

// ── Commands ─────────────────────────────────────────────────────────

function cmdInit(targetDir) {
  const resolvedTarget = path.resolve(targetDir);
  const agentMdPath = path.join(resolvedTarget, "AGENT.md");
  const codevDirPath = path.join(resolvedTarget, "codev");

  // Pre-flight checks
  if (!fs.existsSync(resolvedTarget)) {
    console.error(`\n❌ Target directory does not exist: ${resolvedTarget}\n`);
    process.exit(1);
  }

  if (fs.existsSync(agentMdPath) || fs.existsSync(codevDirPath)) {
    console.error(
      "\n⚠️  CODEV is already initialized in this directory (AGENT.md or codev/ exists)."
    );
    console.error(
      "   To re-initialize, remove AGENT.md and the codev/ folder first.\n"
    );
    process.exit(1);
  }

  // Copy templates
  console.log(`\n🚀 Initializing CODEV Framework in: ${resolvedTarget}\n`);

  fs.copyFileSync(path.join(TEMPLATES_DIR, "AGENT.md"), agentMdPath);
  console.log("   ✅ AGENT.md");

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

     "Read AGENT.md and initialize the project knowledge base."

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
    help            Show this help message
    version         Show version

  EXAMPLES
    codev init              Initialize in the current directory
    codev init ./my-app     Initialize in ./my-app
    codev init /path/to/repo

  WORKFLOW
    1.  Run "codev init" in your project root
    2.  Tell your AI agent: "Read AGENT.md and initialize the project"
    3.  The agent scans the repo, writes atomic knowledge docs,
        and turns AGENT.md into a project dashboard
    4.  From then on, any new agent reads AGENT.md first,
        follows the index, and picks up right where the last one left off
`);
}

// ── Main ─────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";

  switch (command) {
    case "init":
      cmdInit(args[1] || process.cwd());
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
