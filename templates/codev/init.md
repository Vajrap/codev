# CODEV Initialization Workflow

Welcome, AI Agent! You have been tasked with initializing the project knowledge base
for this repository. Follow each step in order.

> **Important**: Each knowledge file you create MUST be ≤ 150 lines.
> Split large domains into multiple focused files.

---

## Step 1: Gather Project Info

Ask the user to provide:

1. **Project Name** — The name of this project.
2. **Project Description** — What it does, who it's for, and key goals.
3. **Additional Context** — Any history, preferences, or constraints
   (e.g., "we use pnpm, not npm", "the legacy API is being deprecated").

---

## Step 2: Explore the Repository

Scan the repository thoroughly:

1. **Directory structure** — Map out the folder layout and key entry points.
2. **Package files** — Read `package.json`, `requirements.txt`, `go.mod`,
   `Cargo.toml`, or equivalent to identify dependencies and scripts.
3. **Configuration** — Check for `.env.example`, `docker-compose.yml`,
   CI/CD configs (`.github/workflows/`, etc.), linter configs.
4. **Source code** — Understand the main architecture: entry points, routing,
   database layer, authentication, API structure, etc.
5. **Documentation** — Read any existing `README.md`, `CONTRIBUTING.md`,
   or docs/ folder.

---

## Step 3: Generate the Environment Profile

Create `codev/profile.md` containing:

- System requirements (OS, language runtime versions, tools)
- Package manager and install commands
- Required environment variables (reference `.env.example` if it exists)
- Setup commands (step-by-step from clone to running)
- Common issues and their fixes

Use the template: `codev/templates/knowledge_template.md`

---

## Step 4: Generate Atomic Knowledge Docs

Create individual files under `codev/knowledges/`. Each file should cover
**one domain** and be **≤ 150 lines**.

**Minimum set** (create all that apply):

| File | Content |
|------|---------|
| `architecture.md` | High-level system design, component diagram, data flow |
| `tech_stack.md` | Languages, frameworks, databases, and their versions |
| `folder_structure.md` | Directory layout with descriptions of each folder |
| `database_schema.md` | Models, relationships, key tables/collections |
| `api_routes.md` | API endpoints, methods, request/response shapes |
| `auth_flow.md` | Authentication/authorization mechanism |
| `deployment.md` | How the app is built, deployed, and hosted |
| `testing.md` | Test setup, how to run tests, coverage expectations |

**Additional files** (create if relevant):

| File | When to Create |
|------|---------------|
| `payments.md` | If Stripe, PayPal, or billing logic exists |
| `queues.md` | If background jobs, message queues exist |
| `caching.md` | If Redis, Memcached, or caching strategies exist |
| `websockets.md` | If real-time features exist |
| `third_party.md` | If significant third-party integrations exist |
| `state_management.md` | If complex frontend state (Redux, Zustand, etc.) |

Use the template: `codev/templates/knowledge_template.md`

---

## Step 5: Generate Conventions

Create `codev/conventions.md` by analyzing existing code patterns:

- File and folder naming conventions
- Component/module structure patterns
- Import/export style (named vs default)
- Error handling patterns
- Testing patterns and naming
- Git branch and commit conventions (if visible in history)

---

## Step 6: Generate Guardrails

Create `codev/guardrails.md` identifying:

- **Files/folders that must not be modified** (e.g., migrations, lock files)
- **Files/folders that must not be deleted** (e.g., tests, configs)
- **Patterns to avoid** (e.g., `any` type, `console.log` in production)
- **Security rules** (e.g., never hardcode secrets, always sanitize input)
- **Dependency rules** (e.g., ask before installing new packages)

---

## Step 7: Build the Glossary

Create `codev/glossary.md` with domain-specific terms extracted from:

- Code (class names, module names, comments)
- Documentation (README, inline docs)
- Configuration (environment variable names)

Present the glossary to the user and ask them to verify and expand it.

---

## Step 8: Build the Master Index

Generate `codev/index.md` as the central table of contents:

- Link to every knowledge file with a one-line description
- Organize by category (Core, Infrastructure, Features, etc.)
- Include links to active work areas (current_ticket, decisions, sessions)

---

## Step 9: Update AGENT.md

Rewrite the root `AGENT.md` to serve as the **project cover page**.

Use the template: `codev/templates/agent_post_init_template.md`

The updated AGENT.md should contain:
- Project name and one-line description
- Navigation links to all key codev files
- A note that the knowledge base has been initialized

**Keep AGENT.md short** — detailed info lives in `profile.md`, `index.md`, etc.

---

## Step 10: Report to User

Present a summary to the user:

1. List all files created with one-line descriptions.
2. Highlight files that need user review:
   - `codev/guardrails.md` — Are the safety boundaries correct?
   - `codev/glossary.md` — Are the domain terms accurate?
   - `codev/conventions.md` — Do these match team standards?
3. Confirm that AGENT.md has been updated.
4. Explain how to use `codev/current_ticket/` for future tasks.

---

## Post-Initialization

After init is complete, this file (`init.md`) remains in the repository as
documentation of the onboarding process. It can be re-run if the knowledge base
needs to be rebuilt from scratch (e.g., after a major refactor).

For day-to-day agent work, the agent should:
1. Start by reading `AGENT.md`
2. Follow links to `codev/index.md` for specific domain knowledge
3. Check `codev/current_ticket/` for active work context
4. Follow `codev/preflight.md` before making code changes
