# Pre-Flight Checklist

> Run through this checklist before making any code changes.
> This ensures you have the right context and won't accidentally break things.

---

## Context Loading

- [ ] Read `AGENT.md` for project overview
- [ ] Read `codev/index.md` to locate relevant knowledge files
- [ ] Read knowledge files related to the current task
- [ ] Read `codev/guardrails.md` for safety boundaries
- [ ] Read `codev/conventions.md` for coding standards

## Active Work Check

- [ ] Check `codev/current_ticket/` for existing work context
- [ ] Check `codev/sessions/` for recent session logs (handoff notes)
- [ ] Check `codev/decisions/` for relevant past decisions

## Environment Check

- [ ] Confirm you can reference `codev/profile.md` for setup commands
- [ ] Verify the development environment is functional (run dev server, tests)

## Before Writing Code

- [ ] Create a new git branch for this work (if not already on one)
- [ ] Confirm the acceptance criteria for the current task
- [ ] Identify affected files and check the dependency map (if available)
- [ ] Review risk zones for any high-risk files you'll be modifying

## After Writing Code

- [ ] Run the test suite
- [ ] Update relevant knowledge files if your changes affect them
- [ ] Log your session in `codev/sessions/`
- [ ] Update `codev/current_ticket/changes.md` with what you modified
