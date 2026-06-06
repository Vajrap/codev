# Current Ticket: Dashboard Navigation Bug Fixes

> **Date**: 2026-06-06
> **Status**: Completed

## Scope

Fix dashboard navigation issues found during manual use.

## Findings

- `codev serve` rooted the dashboard at the project root, which exposed non-CODEV folders and made navigation feel outside the knowledge domain.
- Markdown links rendered as normal browser links, so relative `.md` links requested routes the server does not serve.
- Breadcrumb click handlers captured a mutable loop variable, so nested breadcrumb clicks did not navigate to their own path.

## Changes

- Make `serve` prefer a target project's `codev/` directory when present.
- Intercept relative Markdown `.md` links in the preview and open them through dashboard state.
- Intercept relative directory links in the preview and open them through dashboard state.
- Capture breadcrumb paths per button.
- Updated README/help/architecture wording for the CODEV-rooted dashboard.
- Verified API routes for CODEV root scan, nested Markdown files, and nested folders.

## Blockers

- None.
