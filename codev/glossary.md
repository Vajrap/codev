# Glossary

| Term | Definition |
|------|-----------|
| **Scaffolding** | The process of copying predefined templates to initialize a directory structure in a repository. |
| **Agent** | An autonomous AI assistant interacting with the repository. |
| **Atomic Knowledge** | Domain-specific markdown documentation designed to be highly focused and kept under 150 lines. |
| **Index** | A table of contents (`index.md`) directing the agent to specific parts of the project's knowledge base. |
| **Manifest** | The `codev/manifest.yaml` control plane that declares task routes and fallback knowledge. |
| **Normalized Task** | Explicit action, scope, and optional paths supplied to deterministic routing after agent or user interpretation. |
| **Route** | A manifest mapping from normalized selectors to ordered skills, knowledge, state, guardrails, and verification. |
| **Managed Block** | Marker-delimited adapter content Codev may update without owning the surrounding host file. |
| **Guardrails** | Boundaries and safety regulations detailing what files or code patterns the agent should not touch. |
| **Pre-flight Check** | Verification steps performed before a task or operation to check for potential errors. |
