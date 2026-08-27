# Guardrails

## Do NOT Modify
- Do not edit the base templates inside `templates/` when implementing code specific to this repository's `codev/` folder. All modifications to global template styles must be done carefully to prevent breaking CLI users.
- Do not change execution permissions on `index.js`. It must remain executable (`chmod +x`).

## Do NOT Delete
- Never delete the `.gitkeep` files in `templates/` folder structure, otherwise git will not track empty directories.

## Safe Development Rules
- Never add external npm dependencies to `package.json` without explicit user permission.
- Always perform a pre-flight existence check before creating files or folders.
- Ensure the shebang `#!/usr/bin/env node` remains at the very top of `index.js`.
- Never overwrite host-project `AGENTS.md`, `AGENT.md`, or `CLAUDE.md` during installation or upgrade.
- Modify root agent instructions only inside the explicit Codev managed markers.
- Do not describe natural-language task classification as deterministic.
