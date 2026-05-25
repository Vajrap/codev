# Folder Structure

> **Domain**: folder_structure
> **Last Verified**: 2026-05-25
> **Verified By**: Antigravity

---

## Directory Layout

```
├── .gitignore          - Standard git ignores (node_modules, .DS_Store)
├── LICENSE             - MIT license terms
├── README.md           - GitHub repository landing page and usage guide
├── index.js            - Main executable CLI entry point
├── package.json        - CLI configuration and exports
└── templates/          - Scaffolding templates copied to target repos
    ├── AGENTS.md        - Signpost pointing new agents to codev/init.md
    └── codev/          - The core folder structure templates
        ├── index.md    - Knowledge index skeleton
        ├── init.md     - Agent onboarding instructions
        ├── preflight.md- Agent pre-work checklist
        └── templates/  - Reusable agent document templates
```

---

## Key Directories

- **`templates/`**: Contains the blueprint files. Any additions or edits to how CODEV initializes other projects should be modified here.
- **`codev/`**: The self-hosted CODEV workspace for *this* project (CODEV itself). It is used to keep track of this codebase's own documentation and active tickets.
