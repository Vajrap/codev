# Ticket: CODEV-002 — Capability Routing and Safe Adoption

> **Priority**: High
> **Type**: Feature
> **Created**: 2026-08-27
> **Completed**: 2026-08-27
> **Status**: Done

## Description

Evolve Codev from an index-first scaffold into a project-local capability router.
Existing project agent instructions survive installation unchanged, while Codev
provides a dedicated bootstrap entry, deterministic manifest validation and
routing, and explicit managed integration for `AGENTS.md`.

## Acceptance Criteria

- [x] `codev init` installs beside existing `AGENTS.md`, `AGENT.md`, and `CLAUDE.md` files without changing them.
- [x] `codev/START.md` is the canonical agent-driven bootstrap entry.
- [x] `codev/manifest.yaml` declares deterministic task routes and focused context.
- [x] `codev validate` rejects malformed manifests and missing references.
- [x] `codev route` returns the same ordered load plan for the same normalized inputs.
- [x] `codev integrate agents` manages only its marked Codev adapter and insertion separator.
- [x] `codev upgrade` adds the v0.2 bootstrap contract without overwriting existing knowledge.
- [x] Tests cover safe adoption, idempotence, integration, validation, routing, and fallback behavior.
- [x] User documentation and self-hosted Codev knowledge describe the new contract.

## Findings

- Installation and root instruction integration must be separate operations.
- A manifest alone is another index; deterministic value comes from a validating resolver.
- Natural-language classification remains probabilistic and must produce normalized action, scope, and path inputs.
- Marker management must preserve host bytes across an add/remove round trip and reject duplicate or incomplete blocks.
- Path containment must normalize before checking for traversal.
- A dependency-free YAML subset needs explicit rejection tests for unsupported syntax.

## Changes Made

| Area | Change | Reason |
|------|--------|--------|
| CLI | Added safe `init`, additive `upgrade`, `integrate agents`, `validate`, and `route` flows | Establish the v0.2 interface |
| Manifest | Added restricted YAML parsing, schema/reference validation, matching, priority composition, and fallback | Make task execution repeatable after normalization |
| Bootstrap | Added `codev/START.md`; reduced `codev/init.md` to a compatibility pointer | Stop taking ownership of root instructions |
| Templates | Removed root `AGENTS.md`/`CLAUDE.md` templates and added the v0.2 Codev contract | Allow adoption in existing repositories |
| Tests | Added isolated Node CLI behavior coverage | Verify ownership, determinism, and failure modes |
| Documentation | Updated README, architecture, folder structure, conventions, guardrails, glossary, profile, preflight, and index | Keep framework knowledge aligned |

## Verification

- `npm test`: 15 passed, 0 failed.
- `git diff --check`: passed.
- `node index.js validate --project .`: passed.
- `node index.js integrate agents --project . --check`: passed.
- `npm pack --pack-destination /private/tmp --cache /private/tmp/codev-npm-cache`: produced `codev-framework-0.2.0.tgz`.
- Installed-package smoke test: packaged CLI initialized and validated a fresh temporary project.
- Standards review: no remaining hard findings.
- Spec review: no remaining correctness or scope findings.

## Blockers and Remaining Work

None for the repository delivery. The npm registry still reports
`codev-framework@0.1.3`; publishing `0.2.0` is a separate release action and was
not inferred from the request to push `main`.

## Archive Notes

The completed ticket is archived here. Durable architecture and ownership
decisions are recorded in
`codev/decisions/2026-08-27-capability-routing-and-host-instruction-ownership.md`.
