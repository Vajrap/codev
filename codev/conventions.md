# Coding Conventions

## Style & Standards

- **Language**: Standard ES6 JavaScript. No compilation step is used to keep the framework as portable and lightweight as possible.
- **Modules**: CommonJS `require()` and `module.exports` syntax for maximum compatibility out-of-the-box in Node environments.
- **Dependencies**: Keep the framework **zero-dependency**. Any logic must be built using Node.js core libraries (e.g. `fs`, `path`).
- **Tests**: Use the built-in `node:test` runner and isolated temporary projects.

## File Structure

- All template assets must live in `templates/` and replicate the exact target folders.
- Use lowercase filenames for standard knowledge files (e.g., `tech_stack.md`).
- Use uppercase filenames for root agent files (e.g., `AGENTS.md`).
- Use `codev/START.md` as the uppercase, one-time Codev entry; ordinary knowledge filenames remain lowercase.

## CLI Code conventions

- Keep all subcommand routing logic and utilities in `index.js`.
- Always verify the path exits before executing writes or directory reads.
- Exit CLI executions with code `0` on success, and code `1` on error.
- Keep task interpretation outside `codev route`; the command accepts normalized action, scope, and paths only.
- Preserve host-owned files and restrict adapters to explicit managed markers.

## Manifest YAML

- Use two spaces for indentation and mapping-shaped routes keyed by stable IDs.
- Use block scalar lists; do not use anchors, aliases, multiline scalars, or lists of mappings.
- Reference project files with project-relative paths.
- Keep route selection declarative; procedures belong in skills or knowledge files.
