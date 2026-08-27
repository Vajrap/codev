# Session: 2026-08-27 — Codev v0.2 Capability Routing

> **Agent**: Codex
> **Ticket**: CODEV-002

## What Changed

- Replaced root-agent-file ownership with a Codev-owned `START.md` bootstrap.
- Made fresh initialization safe beside existing agent instructions.
- Added additive upgrades for older Codev directories.
- Added deterministic manifest validation and task routing after explicit normalization.
- Added reversible, marker-scoped `AGENTS.md` integration.
- Added fifteen isolated CLI tests and packaged-install smoke verification.
- Updated the package to version `0.2.0` and aligned framework documentation.

## What Was Learned

- Project instructions and framework adapters need explicit, separate ownership.
- Agent inference can select normalized task inputs, but it cannot make natural language deterministic.
- Managed integration must round-trip exact host bytes, including trailing whitespace.
- Traversal checks must run after path normalization.
- A small YAML subset is viable only when unsupported syntax fails visibly.

## Verification

- `npm test`: 15 passed, 0 failed.
- Manifest validation, managed-block check, syntax check, and `git diff --check` passed.
- `npm pack` produced the `0.2.0` package, whose CLI initialized and validated a temporary project.
- Independent standards and spec reviews reported no remaining material findings.

## Remaining Risk

- The restricted YAML subset is intentionally not full YAML; documentation and validation errors must keep that clear.
- Route quality still depends on the agent or user correctly normalizing action and scope.
- The npm registry remains on `0.1.3` until an explicit `0.2.0` publish occurs.

## Handoff

Future work can evaluate native skill materialization, richer route composition,
and task-suggestion tooling against real project manifests. Those features should
not blur the deterministic resolver's input boundary.
