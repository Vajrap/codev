# Pre-Flight Checklist

> Run through this checklist before making any code changes.
> This ensures you have the right context and won't accidentally break things.

---

## Context Loading

- [ ] Read existing project instructions
- [ ] Normalize the task action, scope, and known paths
- [ ] Run `codev route --action <action> --scope <scope> [--path <path>]`
- [ ] Read only the routed skills, knowledge, state, and guardrails
- [ ] Use `codev/index.md` only when no specific route matches

## Active Work Check

- [ ] Check `codev/current_ticket/` for existing work context
- [ ] Check `codev/tickets/` for related completed ticket history
- [ ] Check `codev/sessions/` for recent session logs (handoff notes)
- [ ] Check `codev/decisions/` for relevant past decisions

## Environment Check

- [ ] Confirm you can reference `codev/profile.md` for setup commands
- [ ] Verify the development environment is functional (run dev server, tests)

## Before Writing Code

- [ ] Confirm the current branch or worktree matches the requested execution environment
- [ ] Confirm the acceptance criteria for the current task
- [ ] Identify affected files and check the dependency map (if available)
- [ ] Review risk zones for any high-risk files you'll be modifying

## After Writing Code

- [ ] Run the test suite
- [ ] Update relevant knowledge files if your changes affect them
- [ ] Log your session in `codev/sessions/`
- [ ] Update `codev/current_ticket/` with findings, changes, blockers, and next steps
- [ ] When the ticket is complete, archive it under `codev/tickets/{YYYY-MM-DD-ticket-slug}/`
