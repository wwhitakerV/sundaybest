@AGENTS.md

## Claude Code specifics

**Use plan mode before touching any of these.** They are the files where a wrong
change is expensive or hard to reverse:

- `src/core/security/**` — attestation, secure storage, integrity, session
- `src/core/api/**` — anything that leaves the device
- `app.config.ts` / `app.json` — identity, permissions, entitlements
- `eas.json` and `.eas/**` — build, credential, and submission config

Present the plan and wait for approval before editing them.

**Use the subagents rather than doing their work inline:**

| Subagent            | For                                                             |
| ------------------- | --------------------------------------------------------------- |
| `test-writer`       | Turning a spec's acceptance criteria into failing tests         |
| `security-reviewer` | Reviewing a diff against the MASVS checklist and security rules |
| `code-reviewer`     | Dependency rules, test quality, naming, dead code               |

Both reviewers are read-only: they report, you fix.

**Skills:** `/new-feature`, `/tdd-cycle`, `/add-dependency`, `/release`,
`/update-report`.

`/update-report` also runs on the phrase **"update my report"** (or "update the
report", "refresh my checklist"). It re-audits the whole setup series and brings
`Before-You-Start.html` current — the operator's list of what is missing,
unverified, or waiting on a human. Re-derive every item from the repo, never
from memory or from the previous version of the page.

**Rules** in `.claude/rules/` load automatically — `architecture.md` every
session, the rest only when you touch matching paths.

**Hooks** run without being asked: edits are lint-fixed and formatted, and the
end of each turn typechecks and runs related tests. A turn that ends red is
reported back, so fix it rather than working around it.
