# Start Codev

This is the canonical one-time bootstrap workflow for Codev.

## Ownership

- Preserve existing `AGENTS.md`, `AGENT.md`, `CLAUDE.md`, and other project instructions.
- Treat existing project instructions as authoritative.
- Codev owns `codev/` and only explicitly marked adapter blocks outside it.
- Do not rewrite or replace root agent instructions during bootstrap.

## Bootstrap Workflow

1. Read existing project instructions and documentation.
2. Inspect the repository structure, package metadata, configuration, and active work.
3. Ask only for consequential project context that cannot be discovered safely.
4. Populate focused knowledge under `codev/knowledges/`.
5. Update `codev/profile.md`, `codev/conventions.md`, `codev/guardrails.md`, and `codev/glossary.md` from evidence.
6. Define task routes in `codev/manifest.yaml` using normalized actions, scopes, and paths.
7. Create project-local skills under `.agents/skills/` only for recurring workflows that need implementation guidance.
8. Run `codev validate` and exercise representative `codev route` commands.
9. Present the proposed knowledge, routes, guardrails, and skills for review.
10. Set `bootstrap.status` to `complete` after the user accepts the initialized contract.

## Determinism Boundary

Natural-language task interpretation is agent-driven. Convert it into explicit
`action`, `scope`, and optional `path` values before invoking `codev route`.
Given the same manifest and normalized inputs, routing must be deterministic.

## Optional Root Integration

Do not edit `AGENTS.md` as part of bootstrap. If the user wants persistent root
routing, ask them to run:

```bash
codev integrate agents
```

That command owns only the content between `<!-- codev:start -->` and
`<!-- codev:end -->`.

## Supported Manifest YAML

Codev intentionally accepts a dependency-free YAML subset: two-space mappings,
scalar lists, strings, integers, booleans, null, and empty maps/lists. Do not use
tabs, anchors, aliases, multiline scalars, or lists of mappings.
