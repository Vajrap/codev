# Folder Structure

> **Domain**: folder_structure
> **Last Verified**: 2026-06-05
> **Verified By**: Codex

---

## Directory Layout

```
├── .gitignore          - Standard git ignores (node_modules, .DS_Store)
├── LICENSE             - MIT license terms
├── README.md           - GitHub repository landing page and usage guide
├── dashboard/          - Static assets for the local human dashboard
├── index.js            - Main executable CLI entry point
├── package.json        - CLI configuration and exports
└── templates/          - Scaffolding templates copied to target repos
    ├── AGENTS.md        - Initial agent rules and signpost to codev/init.md
    └── codev/          - The core folder structure templates
        ├── index.md    - Knowledge index skeleton
        ├── init.md     - Agent onboarding instructions
        ├── preflight.md- Agent pre-work checklist
        ├── tickets/    - Completed ticket archive placeholder
        └── templates/  - Reusable agent document templates
```

---

## Key Directories

- **`templates/`**: Contains the blueprint files. Any additions or edits to how CODEV initializes other projects should be modified here.
- **`dashboard/`**: Contains the HTML/CSS/JS served by `codev serve`. These files are package assets, not scaffolded project knowledge files.
- **`codev/`**: The self-hosted CODEV workspace for *this* project (CODEV itself). It is used to keep track of this codebase's own documentation, active ticket, completed ticket archive, decisions, and session notes.
