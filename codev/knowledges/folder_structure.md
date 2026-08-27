# Folder Structure

> **Domain**: folder_structure
> **Last Verified**: 2026-08-27
> **Verified By**: Codex

## Repository Layout

```text
├── AGENTS.md             host instructions for this repository
├── README.md             product and CLI documentation
├── index.js              zero-dependency CLI implementation
├── package.json          package metadata and test script
├── tests/
│   └── cli.test.js       isolated CLI behavior tests
├── dashboard/            local Markdown dashboard assets
├── templates/            assets copied into target projects
│   └── codev/
│       ├── START.md      canonical bootstrap workflow
│       ├── manifest.yaml routing declaration skeleton
│       ├── index.md      human knowledge map and fallback
│       ├── init.md       legacy compatibility pointer
│       ├── preflight.md  routed pre-work checklist
│       ├── current_ticket/
│       ├── tickets/
│       └── templates/
└── codev/                this repository's self-hosted Codev knowledge
```

## Ownership

- `templates/codev/` is the complete directory copied by `codev init`.
- Root agent instruction templates are intentionally absent; host projects own them.
- `codev upgrade` copies only missing contract files into an older installation.
- `dashboard/` is packaged but not copied into initialized projects.
- `codev/` tracks this framework's own knowledge, routes, tickets, decisions, and sessions.
