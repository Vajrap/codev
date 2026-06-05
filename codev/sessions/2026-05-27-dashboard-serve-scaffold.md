# Session: Dashboard Serve Scaffold

> **Date**: 2026-05-27

## Changed

- Added the initial `codev serve` local dashboard server.
- Added a recursive folder browser that separates child folders and Markdown files.
- Added Markdown read, preview, edit, and save flow for existing `.md` files.
- Documented the dashboard command in README and CODEV knowledge files.
- Published `codev-framework@0.1.2` to npm with the dashboard assets included.

## Learned

- CODEV's CLI can support the dashboard without external dependencies by using Node's built-in `http`, `fs`, `path`, and `url` modules.
- A server-backed dashboard is a better fit than static HTML for project-specific folder structures and editable Markdown.

## Remaining Risks

- The browser Markdown renderer is basic and should stay conservative until a fuller renderer is justified.
- Write-back should remain limited to existing Markdown files until the human editing workflow is clearer.
- Users with cached `npx codev-framework` behavior should request `codev-framework@latest` or `codev-framework@0.1.2` explicitly.
