# {Project Name}

> {One-line project description}

---

## Navigation

| | Resource | Description |
|---|----------|-------------|
| 📖 | [Knowledge Index](codev/index.md) | Master table of contents |
| 👤 | [Environment Profile](codev/profile.md) | Dev setup, requirements, env vars |
| 🏗️ | [Architecture](codev/knowledges/architecture.md) | System design overview |
| 📐 | [Conventions](codev/conventions.md) | Coding standards and patterns |
| ⚠️ | [Guardrails](codev/guardrails.md) | Safety boundaries |
| 📚 | [Glossary](codev/glossary.md) | Domain terminology |
| ✅ | [Pre-Flight Checklist](codev/preflight.md) | Run before making changes |
| 🎫 | [Current Ticket](codev/current_ticket/) | Active task context |
| 📜 | [Decision Log](codev/decisions/) | Architectural decisions |
| 🧠 | [Session Log](codev/sessions/) | Agent session memory |

---

## Mandatory Agent Rules

- Start with the index: use [codev/index.md](codev/index.md) to find relevant knowledge before broad code searches.
- Keep the knowledge base current: when you learn durable project facts, update the right file under `codev/knowledges/`, `codev/conventions.md`, `codev/guardrails.md`, or `codev/glossary.md`.
- Record decisions: write meaningful architecture/product tradeoffs in `codev/decisions/`, including context, options, decision, and consequences.
- Maintain ticket context: for ticket work, update `codev/current_ticket/` with scope, findings, changes, blockers, and next steps.
- Leave a postmortem: at the end of substantial work, add a concise session note under `codev/sessions/` covering what changed, what was learned, and remaining risks.
- Challenge assumptions: state key assumptions, look for evidence against them, and re-check before rewrites or broad refactors.
- Be pragmatic: weigh cost, risk, and reversibility; push back when a simpler or safer path better serves the project.

---

> **CODEV Knowledge Base**: Initialized on {YYYY-MM-DD}.
> For the initialization workflow, see [codev/init.md](codev/init.md).
