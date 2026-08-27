# ADR-003: Capability Routing and Host Instruction Ownership

> **Date**: 2026-08-27
> **Status**: Accepted
> **Decided by**: User and Codex

## Context

Codev currently installs and later rewrites root `AGENTS.md` and `CLAUDE.md`
files. This prevents adoption in repositories that already have agent
instructions. Its index-first navigation also asks an agent to interpret a
catalogue on every task instead of resolving a declared task contract.

Newer agents can infer intent and work with large contexts, but project facts,
hard constraints, approval boundaries, and verification contracts still need to
be selected precisely. Natural-language task interpretation remains
probabilistic; route execution can be deterministic only after action, scope,
and paths have been normalized.

## Decision

Codev owns the `codev/` directory and only explicitly marked adapter content
outside it. It does not own an existing root `AGENTS.md`, `AGENT.md`, or
`CLAUDE.md`.

`codev/START.md` is the canonical agent-driven bootstrap entry.
`codev/manifest.yaml` is the canonical routing declaration. The CLI provides a
small deterministic interface:

- `codev init` installs Codev-owned files without altering host instructions.
- `codev upgrade` applies additive, versioned Codev migrations.
- `codev integrate agents` adds, updates, checks, or removes a marked adapter block.
- `codev validate` checks the manifest schema and referenced files.
- `codev route` accepts normalized inputs and emits an ordered load plan.

The manifest uses a documented, dependency-free YAML subset. Natural-language
classification is outside the deterministic resolver.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| Continue owning `AGENTS.md` | Simple fresh-project bootstrap | Blocks adoption and overwrites project governance |
| Use only `codev/index.md` | Fully human-readable | Selection remains probabilistic and difficult to validate |
| Put all workflow logic in YAML | Centralized | Duplicates native skills and creates a shallow metadata catalogue |
| Use Codev manifest plus native skills | Deterministic routing with progressive disclosure | Requires a resolver and adapter lifecycle |

## Consequences

**Positive**:

- Existing repositories can adopt Codev without deleting or replacing instructions.
- Route selection is explainable and repeatable after task normalization.
- Markdown remains the durable knowledge format while YAML provides a machine-readable control plane.
- Platform-specific integration is explicit, narrow, and reversible.

**Negative / Trade-offs**:

- Agents must distinguish task inference from route resolution.
- The zero-dependency YAML subset is intentionally smaller than the full YAML language.
- Existing Codev installations require an additive upgrade before using routing.

**Action Items**:

- Implement and test the commands.
- Update scaffold templates and documentation.
- Evaluate richer skill materialization only after the routing seam proves useful across projects.
