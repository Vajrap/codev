# CODEV

**Project-local knowledge, skills, and deterministic task routing for AI-assisted development.**

Codev keeps durable project context in the repository and loads only the
knowledge and workflows relevant to the current task. Existing project agent
instructions remain authoritative and are never replaced during installation.

## Why Codev

Coding agents can explore large repositories, but indiscriminate context is not
useful context. Projects still need durable facts, explicit safety constraints,
accepted decisions, active-task state, recurring implementation workflows, and
evidence-based verification.

Codev separates those concerns:

| Plane | Responsibility | Source |
|-------|----------------|--------|
| Knowledge | Facts, conventions, decisions, tickets, and handoffs | Markdown under `codev/` |
| Capability | How recurring project work should be performed | Project-local agent skills |
| Routing | Which capability and context apply to normalized task inputs | `codev/manifest.yaml` |
| Resolution | Validate and produce an ordered load plan | Codev CLI |
| Navigation | Human-readable browsing and fallback | `codev/index.md` and dashboard |

Natural-language interpretation remains agent-driven. Once a task is normalized
into an explicit action, scope, and optional paths, Codev routing is deterministic.

## Install Safely

```bash
npx codev-framework init
```

`codev init` creates only the Codev-owned `codev/` directory. Existing
`AGENTS.md`, `AGENT.md`, and `CLAUDE.md` files are preserved byte-for-byte.

Then tell your agent:

> Read `codev/START.md` and initialize Codev for this project. Preserve the
> existing agent instructions.

The bootstrap workflow inspects the repository, populates focused knowledge,
defines project routes, and creates project-local skills only where recurring
work benefits from them.

## Project Layout

```text
your-project/
├── AGENTS.md                 existing host-project instructions, if any
├── .agents/skills/           optional project-local capability skills
└── codev/
    ├── START.md              bootstrap and migration entry
    ├── manifest.yaml         deterministic routing declaration
    ├── index.md              human-readable knowledge map and fallback
    ├── profile.md            environment and setup
    ├── guardrails.md         safety constraints
    ├── conventions.md        accepted project conventions
    ├── glossary.md           project language
    ├── preflight.md          pre-work verification gate
    ├── knowledges/           focused durable project knowledge
    ├── current_ticket/       active work context
    ├── tickets/              completed work archive
    ├── decisions/            architecture and product decisions
    ├── sessions/             substantial-work handoffs
    └── templates/            reusable Codev documents
```

## Deterministic Routing

A route declares when it applies and what must be loaded or enforced:

```yaml
version: 1

project:
  name: example

bootstrap:
  status: complete
  entry: codev/START.md

routing:
  fallback:
    knowledge:
      - codev/index.md

routes:
  implement-backend:
    priority: 100
    when:
      actions:
        - implement
        - fix
      scopes:
        - backend
      paths:
        - server/**
    load:
      skills:
        - implement-backend
      knowledge:
        - codev/knowledges/backend.md
      state:
        - codev/current_ticket/
    enforce:
      guardrails:
        - codev/guardrails.md
      verification: focused-then-full
```

Resolve it with normalized inputs:

```bash
codev route \
  --action implement \
  --scope backend \
  --path server/auth/login.js
```

For machine-readable output:

```bash
codev route --action review --scope project --json
```

Human output is explanatory by default; `--explain` is accepted when callers
want to state that intent explicitly.

Matching routes compose in descending priority order, then by route ID. Values
are de-duplicated while preserving that order. When no route matches, the
manifest's fallback knowledge is returned.

## Manifest Validation

```bash
codev validate
```

Validation checks:

- schema version and required mappings;
- route selector and load shapes;
- project-contained knowledge, state, and guardrail references;
- `.agents/skills/<name>/SKILL.md` references;
- unsupported YAML constructs and indentation errors.

To remain zero-dependency and portable, Codev accepts an intentional YAML
subset: two-space mappings, scalar lists, strings, integers, booleans, null, and
empty maps/lists. It rejects tabs, anchors, aliases, multiline scalars, flow
collections with values, and lists of mappings.

## Optional `AGENTS.md` Integration

Installation and root integration are separate operations:

```bash
codev integrate agents
```

This adds or updates only a marked block:

```md
<!-- codev:start -->
## Codev

For Codev task selection, normalize action and scope, then run `codev route`.
This supersedes index-first Codev routing; `codev/index.md` is the fallback.
Read `codev/START.md` only for initialization or migration.
<!-- codev:end -->
```

Existing content outside the markers is preserved. Integration is idempotent,
checkable, and reversible:

```bash
codev integrate agents --check
codev integrate agents --remove
```

## Upgrade Existing Codev Projects

Older Codev installations already have a `codev/` directory but no manifest.
Upgrade them additively:

```bash
npx codev-framework upgrade
```

The command adds missing `START.md` and `manifest.yaml` files and records the
installed framework version. It does not overwrite existing knowledge or root
agent instructions. Review and complete the new manifest, then run
`codev validate`.

## Dashboard

```bash
codev serve
codev serve ./my-project --port 4174
```

The local server binds to `127.0.0.1`, browses the project's Codev knowledge,
renders Markdown, and supports editing existing Markdown files.

## CLI

```text
codev init [dir]
codev upgrade [dir]
codev integrate agents [--project dir] [--check|--remove]
codev validate [--project dir]
codev route [--project dir] --action value --scope value [--path value] [--explain|--json]
codev serve [dir] [--port number]
codev version
codev help
```

## Principles

- **Host-owned instructions** — adoption must not replace project governance.
- **Agent judgment before routing** — infer the task, then normalize it explicitly.
- **Deterministic execution after routing** — equal manifest and inputs produce an equal plan.
- **Progressive disclosure** — load focused context, not the entire knowledge base.
- **Skills for behavior** — recurring implementation procedures belong in skills.
- **Markdown for durable knowledge** — facts and decisions remain human-readable.
- **YAML for the control plane** — routing is declarative and machine-validatable.
- **Evidence over catalogues** — durable principles point agents toward live precedent.
- **Explicit adapters** — platform integration is narrow, marked, and reversible.

## Development

Codev uses Node.js core modules only.

```bash
npm test
node index.js validate --project .
node index.js route --project . --action implement --scope cli --path index.js
```

## License

MIT
