# CODEV

**AI-agent-friendly project knowledge scaffolding.**

> Give your AI agent persistent, structured context about your codebase — so it stops guessing and starts *knowing*.

---

## The Problem

Every time you start a new AI agent session, it knows nothing about your project. You explain the same things over and over. It reads the wrong files, uses the wrong patterns, breaks things it shouldn't touch, and forgets everything by the next session.

**CODEV fixes this.**

## What It Does

CODEV scaffolds a lightweight knowledge layer into your repository — a set of markdown files that any AI agent can read to instantly understand your project, follow your conventions, and pick up where the last session left off.

```
your-project/
├── AGENT.md              ← Agent reads this first (project cover page)
└── codev/
    ├── init.md            ← First-time onboarding workflow
    ├── index.md           ← Master table of contents
    ├── profile.md         ← Dev environment & setup
    ├── guardrails.md      ← What the agent must NOT do
    ├── conventions.md     ← Coding standards & patterns
    ├── glossary.md        ← Domain-specific terminology
    ├── preflight.md       ← Checklist before making changes
    ├── knowledges/        ← Atomic knowledge files (≤150 lines each)
    ├── decisions/         ← Architectural decision records
    ├── current_ticket/    ← Active task context
    ├── sessions/          ← Agent session memory
    └── templates/         ← Reusable document templates
```

## How It Works

### 1. Scaffold

```bash
npx codev init
```

This adds `AGENT.md` and the `codev/` folder to your project. No dependencies. No config files. Just markdown.

### 2. Onboard

Tell your AI agent:

> *"Read AGENT.md and initialize the project knowledge base."*

The agent follows `codev/init.md` — a step-by-step workflow that instructs it to:

- Ask you about the project
- Scan the entire repository
- Write atomic knowledge docs (architecture, tech stack, database, auth, etc.)
- Build a master index
- Set up guardrails, conventions, and a glossary
- Rewrite `AGENT.md` into a project dashboard

### 3. Work

From now on, every new agent session starts by reading `AGENT.md`. In seconds, it knows:

- What the project is
- How to set up the dev environment
- Where to find domain-specific knowledge
- What files not to touch
- What coding patterns to follow
- What the current task is

No more re-explaining. No more hallucinated architecture. No more broken migrations.

---

## Core Concepts

### Atomic Knowledge (≤150 lines per file)

Knowledge files are short, focused, and single-domain. Instead of one massive doc, you get:

```
codev/knowledges/
├── architecture.md       ← System design overview
├── tech_stack.md          ← Languages, frameworks, versions
├── database_schema.md    ← Models and relationships
├── api_routes.md          ← Endpoints and contracts
├── auth_flow.md           ← Authentication mechanism
├── deployment.md          ← Build and deploy pipeline
└── ...
```

**Why?** Small files fit in context windows. The agent reads only what's relevant to the current task — guided by the index.

### The Index (`codev/index.md`)

A table of contents that maps domains to files. The agent doesn't read the whole codebase — it reads the index and navigates to exactly what it needs.

### Guardrails (`codev/guardrails.md`)

Explicit boundaries: files the agent must not edit (migrations, lock files), patterns to avoid (`any` types, `console.log`), security rules (never hardcode secrets). Think of it as a fence around dangerous areas.

### Session Memory (`codev/sessions/`)

After each session, the agent logs what it did, what it learned, and what's left. The next agent reads the handoff notes and continues seamlessly.

### Decision Records (`codev/decisions/`)

Track *why* decisions were made. When an agent suggests switching your ORM, the ADR explains why you chose this one — preventing circular debates.

---

## Installation

```bash
# Run directly with npx (no install needed)
npx codev init

# Or install globally
npm install -g codev

# Or clone and link locally
git clone https://github.com/user/codev.git
cd codev
npm link
```

## Usage

```bash
# Initialize in current directory
codev init

# Initialize in a specific directory
codev init ./my-project

# Show help
codev help

# Show version
codev version
```

## After Initialization

Tell your AI agent to begin the onboarding:

> *"Read AGENT.md and initialize the project knowledge base."*

The agent will:
1. Ask you for the project name and description
2. Scan the repository structure, dependencies, and source code
3. Generate atomic knowledge files under `codev/knowledges/`
4. Create the environment profile, conventions, guardrails, and glossary
5. Build the master index at `codev/index.md`
6. Update `AGENT.md` into a project dashboard

---

## Works With Any AI Agent

CODEV is just markdown files. It works with:

- **Claude** (Anthropic)
- **Gemini** (Google)
- **GPT / ChatGPT** (OpenAI)
- **Cursor / Windsurf / Cline**
- **GitHub Copilot**
- Any AI tool that can read files

No vendor lock-in. No proprietary formats. No API keys required.

---

## Philosophy

- **Markdown over metadata** — Human-readable, agent-readable, version-controllable
- **Atomic over monolithic** — Small focused files over one giant doc
- **Indexed over scattered** — A central map so agents don't wander
- **Guarded over permissive** — Explicit boundaries prevent agent mistakes
- **Persistent over ephemeral** — Knowledge survives across sessions

---

## Contributing

Contributions are welcome! Whether it's new templates, CLI improvements, or documentation.

## License

MIT
