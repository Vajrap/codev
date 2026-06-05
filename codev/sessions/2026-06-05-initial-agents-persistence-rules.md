# Session: 2026-06-05 — Initial AGENTS Persistence Rules

> **Agent**: Codex
> **Ticket**: initial-agents-persistence-rules
> **Duration**: ~10 min

---

## What I Did

- Verified the published npm `latest` version is `codev-framework@0.1.2`.
- Confirmed the published post-init AGENTS template already includes explicit persistence rules.
- Strengthened the initial scaffolded `templates/AGENTS.md` so partially initialized projects also carry explicit persistence rules.
- Updated architecture and folder structure knowledge for the template behavior.

---

## What I Learned

- `codev init` copies template files directly from `templates/`; AGENTS content is not generated dynamically by the CLI.
- The main residual risk is older or partially initialized projects, not the latest post-init template.

---

## Files Modified

| File | Change |
|------|--------|
| `templates/AGENTS.md` | Expanded mandatory rules for knowledge, decisions, ticket context, and session notes. |
| `codev/knowledges/architecture.md` | Documented explicit initial AGENTS persistence rules. |
| `codev/knowledges/folder_structure.md` | Updated template description. |
| `codev/current_ticket/initial-agents-persistence-rules.md` | Recorded ticket context. |
| `codev/sessions/2026-06-05-initial-agents-persistence-rules.md` | Added session handoff note. |

---

## What's Left

- [ ] Decide whether this should be included in a `0.1.3` release.

---

## Handoff Notes

If preparing `0.1.3`, consider pairing this with the planned ticket workflow improvements and then verify the packed npm tarball includes the updated template.
