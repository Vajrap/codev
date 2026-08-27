# Tech Stack

> **Domain**: tech_stack
> **Last Verified**: 2026-08-27
> **Verified By**: Codex

---

## Core Technologies

- **Runtime**: Node.js (supported version >= 18.x).
- **Language**: JavaScript (ES6+ CommonJS syntax).
- **Package Manager**: npm (Standard package manager).

---

## Key Dependencies

The CLI has **zero production dependencies**. It uses standard Node.js built-in core modules:
- `fs` — File system operations (reading, writing, copying files, creating directories).
- `http` — Local dashboard server for `codev serve`.
- `path` — Utilities for resolving file and directory paths across different platforms.
- `url` — Request URL parsing for dashboard routes and query parameters.
- `node:test` — Built-in test runner for isolated CLI behavior tests.

---

## Dev Tools & Scripts

- `npm link` — Used during development to register the CLI globally.
- `npm publish` — Used to release new versions of `codev-framework` to the npm registry.
- `npm pack` — Used to verify published package contents before release.
- `npm test` — Runs the complete built-in Node test suite.
