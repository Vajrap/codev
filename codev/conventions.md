# Coding Conventions

## Style & Standards

- **Language**: Standard ES6 JavaScript. No compilation step is used to keep the framework as portable and lightweight as possible.
- **Modules**: CommonJS `require()` and `module.exports` syntax for maximum compatibility out-of-the-box in Node environments.
- **Dependencies**: Keep the framework **zero-dependency**. Any logic must be built using Node.js core libraries (e.g. `fs`, `path`).

## File Structure

- All template assets must live in `templates/` and replicate the exact target folders.
- Use lowercase filenames for standard knowledge files (e.g., `tech_stack.md`).
- Use uppercase filenames for root agent files (e.g., `AGENT.md`).

## CLI Code conventions

- Keep all subcommand routing logic and utilities in `index.js`.
- Always verify the path exits before executing writes or directory reads.
- Exit CLI executions with code `0` on success, and code `1` on error.
