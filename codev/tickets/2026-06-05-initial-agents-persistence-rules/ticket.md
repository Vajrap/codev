# Archived Ticket: Strengthen Initial AGENTS Persistence Rules

> **Date**: 2026-06-05
> **Final Status**: Completed

## Scope

Make the first scaffolded `templates/AGENTS.md` explicit about CODEV persistence duties so partially initialized projects still tell agents to update knowledge, decisions, ticket context, and session notes.

## Findings

- The published `codev-framework@0.1.2` post-init template already has explicit persistence rules.
- The initial scaffolded `templates/AGENTS.md` used shorter wording that was correct but less specific.
- The CLI copies templates directly; it does not synthesize AGENTS content at runtime.

## Changes

- Updated `templates/AGENTS.md` to mirror the stronger mandatory rules from the post-init template.
- Updated CODEV architecture and folder structure knowledge to describe the stronger initial template.

## Risks

- This does not affect projects already initialized from older package versions unless their AGENTS.md is manually updated.
