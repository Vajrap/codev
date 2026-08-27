# Start Codev

This is the canonical one-time bootstrap and migration workflow for Codev.

## Ownership

- Preserve existing root agent instructions.
- Treat `AGENTS.md` as host-project governance, not a Codev-owned file.
- Codev owns `codev/` and only explicitly marked adapter blocks outside it.
- Use `codev integrate agents` for reversible root integration.

## Bootstrap or Migration

1. Read the host project's instructions and relevant existing Codev knowledge.
2. Inspect live repository state before accepting historical assumptions.
3. Populate or refresh focused project knowledge.
4. Define task routes in `codev/manifest.yaml` with explicit actions, scopes, and paths.
5. Keep recurring implementation procedures in project-local skills rather than knowledge indexes.
6. Run `codev validate` and representative `codev route` commands.
7. Present consequential routing, guardrail, and skill decisions for user review.
8. Mark `bootstrap.status` complete only after the contract is accepted.

Natural-language interpretation remains agent-driven. The CLI becomes
deterministic after the task is normalized into explicit route inputs.
