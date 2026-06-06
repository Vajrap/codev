# CODEV Framework

> This repository uses the **CODEV Framework** for AI-assisted development.
> The knowledge base has **not been initialized yet**.

---

## 🚀 Getting Started

**AI Agent**: Please read and execute the initialization workflow:

👉 **[codev/init.md](codev/init.md)**

This will guide you through scanning the repository, building the knowledge base,
and setting up this file as the project dashboard.

---

## Mandatory Agent Rules

- Start with [codev/init.md](codev/init.md), then use `codev/index.md` after initialization.
- Keep the knowledge base current: when you learn durable project facts, update the right file under `codev/knowledges/`, `codev/conventions.md`, `codev/guardrails.md`, or `codev/glossary.md`.
- Record decisions: write meaningful architecture/product tradeoffs in `codev/decisions/`, including context, options, decision, and consequences.
- Maintain ticket context: use `codev/current_ticket/` for active work, archive completed ticket context under `codev/tickets/`, and preserve findings, changes, blockers, and next steps.
- Leave a postmortem: at the end of substantial work, add a concise session note under `codev/sessions/` covering what changed, what was learned, and remaining risks.
- Challenge assumptions: state key assumptions, look for evidence against them, and re-check before rewrites or broad refactors.
- Be pragmatic: weigh cost, risk, and reversibility; push back when a simpler or safer path better serves the project.

---

## What is CODEV?

CODEV (Collaborative Developer) is a framework that gives AI agents persistent,
structured knowledge about a codebase. Instead of re-reading the entire repository
every session, agents use atomic knowledge files (≤150 lines each) organized under
a master index.

**Once initialized, this file will be updated to serve as the project's cover page.**
