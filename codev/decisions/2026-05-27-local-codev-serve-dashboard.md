# Decision: Local `codev serve` Dashboard

> **Date**: 2026-05-27
> **Status**: Accepted

## Context

CODEV currently scaffolds Markdown files that are efficient for AI agents but become hard for humans to navigate as the knowledge base grows. A pure Markdown workflow risks turning agent-assisted development into unstructured "vibe coding" because humans lack a clear operating surface for current tickets, decisions, guardrails, and project knowledge.

The team considered moving knowledge files from Markdown to HTML, or generating static HTML dashboards. Static HTML improves readability, but browser JavaScript cannot reliably scan arbitrary local project folders or write knowledge updates back to disk without extra permissions or a server.

## Options

1. Keep Markdown only.
2. Replace Markdown knowledge files with HTML.
3. Generate static HTML and manifest files into each project.
4. Ship a small local `codev serve` server with each initialized project.

## Decision

Adopt a small optional local server model as the preferred direction:

```bash
codev serve
codev serve .
codev serve /path/to/project
```

The server should be lightweight enough to duplicate into CODEV-initialized projects. Users run it from a project root when they want a human-readable dashboard over the CODEV knowledge base.

Markdown remains the durable source of truth. The server reads the project folder, scans `AGENTS.md` and `codev/`, and serves a local human dashboard.

## Constraints

- Bind to localhost only.
- Keep the first version read-only.
- Preserve the zero-dependency bias unless a dependency is explicitly justified.
- Do not run as a background daemon on install.
- Use the current working directory by default, with an explicit path override.
- Avoid generated dashboard artifacts that create noisy repository churn.

## Consequences

- Humans get a navigable project cockpit without making Markdown carry UI concerns.
- Agents can continue reading and writing compact Markdown knowledge files.
- Future versions can add controlled write-back from the dashboard to Markdown.
- The CLI grows beyond scaffolding, so the architecture should distinguish `init` from runtime inspection commands.
