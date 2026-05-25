# Architecture

> **Domain**: architecture
> **Last Verified**: 2026-05-25
> **Verified By**: Antigravity

---

## Overview

The `codev-framework` package is a lightweight, zero-dependency command line interface (CLI) designed to scaffold a standardized repository structure for AI agent interaction.

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
                 ┌────────────┴────────────┐
                 ▼                         ▼
         [Read Templates]          [Write Target Workspace]
       (templates/ folder)            (AGENT.md & codev/)
```

---

## Execution Flow

1. **CLI Execution**: The user runs `codev init` or `npx codev-framework init`.
2. **Arguments Parsing**: `index.js` parses parameters (`init`, `help`, `version`).
3. **Pre-flight Check**: The CLI checks if `AGENT.md` or `codev/` already exists in the target directory to prevent accidental overwrite.
4. **Copying Assets**: The CLI copies template files recursively from the package's local `templates/` directory to the target directory.
5. **Success Summary**: The CLI outputs clear, actionable next steps for the user to invoke their AI agent on the newly initialized project.
