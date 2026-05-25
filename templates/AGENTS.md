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
- Keep CODEV current: write durable findings, decisions, conventions, and guardrails into the appropriate `codev/` files.
- For ticket work, maintain `codev/current_ticket/` with scope, findings, changes, blockers, and next steps.
- End substantial work with a concise note under `codev/sessions/`.
- Challenge assumptions before rewrites: seek contradicting evidence, weigh cost and risk, and push back when needed.

---

## What is CODEV?

CODEV (Collaborative Developer) is a framework that gives AI agents persistent,
structured knowledge about a codebase. Instead of re-reading the entire repository
every session, agents use atomic knowledge files (≤150 lines each) organized under
a master index.

**Once initialized, this file will be updated to serve as the project's cover page.**
