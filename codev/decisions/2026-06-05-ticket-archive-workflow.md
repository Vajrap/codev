# Decision: Preserve Completed Ticket Context in `codev/tickets/`

> **Date**: 2026-06-05
> **Status**: Accepted
> **Decided by**: Codex + user discussion

---

## Context

CODEV originally scaffolded `codev/current_ticket/` as the only ticket workspace. In practice, the active ticket folder accumulates useful scope, findings, blockers, and implementation notes. When a new ticket starts, replacing that folder loses task-specific history that may still be useful for later review.

## Options Considered

1. Keep using only `codev/current_ticket/`.
2. Store all ticket history in `codev/sessions/`.
3. Add a dedicated completed-ticket archive under `codev/tickets/`.

## Decision

Add `codev/tickets/` as the completed ticket archive and keep `codev/current_ticket/` focused on active work.

Completed tickets should be archived under `codev/tickets/{YYYY-MM-DD-ticket-slug}/`. Durable facts still move into knowledge files, and architecture/product tradeoffs still move into `codev/decisions/`.

## Consequences

- New ticket work gets a clean active workspace.
- Completed ticket findings remain available for later review.
- Agents must archive completed ticket context before resetting `current_ticket/`.
- The archive may grow over time, so the index and dashboard should help humans navigate it.
