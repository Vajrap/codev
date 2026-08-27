# Architecture

> **Domain**: architecture
> **Last Verified**: 2026-08-27
> **Verified By**: Codex

## Overview

`codev-framework` is a zero-dependency Node.js CLI that installs a project-local
knowledge and capability-routing layer and serves a local Markdown dashboard.
It owns `codev/`; host-project agent instructions remain independently owned.

## Planes

```text
Natural-language task
        │ agent normalizes action, scope, paths
        ▼
codev/manifest.yaml ── codev validate
        │
        └────────────── codev route
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
         local skills    focused knowledge   guardrails/state

codev/index.md ───────── human navigation and fallback
codev serve ───────────── local Markdown dashboard
```

- **Knowledge plane**: Markdown facts, decisions, tickets, and handoffs.
- **Capability plane**: project-local skills containing recurring procedures.
- **Routing plane**: YAML routes from normalized task selectors to load plans.
- **Adapter plane**: explicitly marked integration such as the Codev block in `AGENTS.md`.
- **Human plane**: index and dashboard browsing.

## Ownership Contract

- `codev init` writes only a new `codev/` directory.
- Existing `AGENTS.md`, `AGENT.md`, and `CLAUDE.md` files are preserved.
- `codev integrate agents` owns only its marked block.
- `codev upgrade` adds missing v0.2 contract files and updates `codev/.version`.
- An unrecognized existing `codev/` directory blocks fresh initialization.

## Determinism Contract

Task interpretation is probabilistic and outside the resolver. The agent or user
must supply explicit `action`, `scope`, and optional paths. Given the same valid
manifest and normalized inputs, `codev route`:

1. Matches all eligible routes.
2. Sorts by descending priority and then route ID.
3. Composes load and enforcement values in that order.
4. De-duplicates while preserving the first occurrence.
5. Uses declared fallback knowledge when nothing matches.

## Manifest Reader

The manifest reader implements a constrained YAML subset using Node core modules.
It supports two-space mappings, scalar lists, quoted or plain strings, integers,
booleans, null, and empty maps/lists. Unsupported YAML features fail explicitly.
Validation checks schema shape, project-contained references, and native skill
entry points before routing.

## CLI Flows

### Install

1. Confirm the target exists and is a directory.
2. Return success when a manifest-based installation already exists.
3. Refuse an ambiguous pre-existing `codev/` directory.
4. Copy templates into `codev/` and write `codev/.version`.
5. Report preserved root agent files and the `codev/START.md` prompt.

### Integrate

1. Read `AGENTS.md`, or start with empty content when absent.
2. Validate marker completeness.
3. Add or replace the exact marked block idempotently.
4. Support read-only checking and reversible removal.

### Serve

1. Bind an HTTP server to `127.0.0.1`.
2. Scan folders under the resolved Codev root.
3. Read or update existing Markdown files through path-contained endpoints.
4. Serve the dashboard assets from the package.

## Failure Modes

- Ambiguous `codev/` ownership stops installation without writes.
- Malformed integration markers stop rather than rewriting surrounding content.
- Invalid YAML or missing references stop validation and routing.
- Natural-language requests are never presented as deterministic route inputs.
- Full YAML compatibility is intentionally not implied.
