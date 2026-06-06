# Architecture

> **Domain**: architecture
> **Last Verified**: 2026-06-05
> **Verified By**: Codex

---

## Overview

The `codev-framework` package is a lightweight, zero-dependency command line interface (CLI) designed to scaffold a standardized repository structure for AI agent interaction and serve a local human dashboard over that knowledge base.

---

## Component Layout

```
                        [User Terminal]
                              │
                      (runs codev init)
                              │
                              ▼
                       [index.js (CLI)]
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
   [init command]                           [serve command]
          │                                       │
          ▼                                       ▼
 [Read Templates]                       [Localhost HTTP Server]
(templates/ folder)                              │
          │                         ┌─────────────┴─────────────┐
          ▼                         ▼                           ▼
 [Write Target Workspace]   [Scan Project Folders]      [Serve Dashboard UI]
   (AGENTS.md & codev/)       (Markdown + folders)       (dashboard/ assets)
```

---

## Init Execution Flow

1. **CLI Execution**: The user runs `codev init` or `npx codev-framework init`.
2. **Arguments Parsing**: `index.js` parses parameters (`init`, `help`, `version`).
3. **Pre-flight Check**: The CLI checks if `AGENTS.md` or `codev/` already exists in the target directory to prevent accidental overwrite.
4. **Copying Assets**: The CLI copies template files recursively from the package's local `templates/` directory to the target directory.
5. **Initial Agent Instructions**: The scaffolded `AGENTS.md` already includes explicit persistence rules for durable knowledge, decisions, active ticket context, completed ticket archives, and session notes before post-init rewrite.
6. **Success Summary**: The CLI outputs clear, actionable next steps for the user to invoke their AI agent on the newly initialized project.

## Serve Execution Flow

1. **CLI Execution**: The user runs `codev serve`, optionally with a project path and `--port`.
2. **Local Server**: `index.js` starts a Node `http` server bound to `127.0.0.1`.
3. **Folder Scan**: `/api/scan` reads the requested folder under the served CODEV root and returns child folders plus Markdown files.
4. **Markdown Read**: `/api/file` reads a selected `.md` file and returns its content.
5. **Markdown Save**: `POST /api/file` writes edited content back to an existing `.md` file inside the served project root.
6. **Dashboard UI**: Static assets under `dashboard/` render the CODEV browser, Markdown preview, editor, and save flow.
