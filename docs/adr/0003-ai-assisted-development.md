# ADR 0003 — AI-assisted development system

- **Status:** Accepted
- **Date:** 2026-09-15
- **Deciders:** @wwhitakerv

## Context

Most of this codebase will be written by coding agents. That changes which
failure modes matter. Agents are fast and tireless but they also confidently
assert things that are not true, take the shortest path to a green check, and
have no memory of a decision made last week.

Three specific risks:

1. **Plausible-but-wrong changes.** An agent will happily lower a coverage
   threshold, add `eslint-disable`, or widen a boundary rule to make a check
   pass. Each is locally reasonable and globally corrosive.
2. **Instructions that do not load.** A rulebook nobody reads is decoration.
   `CLAUDE.md` loads every session and competes for context; a 400-line one gets
   skimmed.
3. **Security decisions made in passing.** The expensive mistakes here — a
   secret in an `EXPO_PUBLIC_` variable, a token in AsyncStorage, an unparsed
   payload — look like ordinary code while being written.

Prompts 1–4 established tooling that catches mechanical errors. This ADR covers
what to do about judgement errors.

## Decision

Four layers, chosen so each risk is caught by the cheapest mechanism that can
catch it.

### 1. Rules that load conditionally

`AGENTS.md` (~134 lines) is the canonical rulebook; `CLAUDE.md` imports it with
`@AGENTS.md` and adds only Claude Code specifics. Topic rules live in
`.claude/rules/`:

| Rule              | Loads                                                                          |
| ----------------- | ------------------------------------------------------------------------------ |
| `architecture.md` | every session                                                                  |
| `testing.md`      | test files, `test/**`, `jest.config.js`                                        |
| `security.md`     | `src/core/{security,api,storage,config}/**`, app config, `eas.json`, `.eas/**` |
| `ui.md`           | `src/ui/**`, feature components and screens                                    |

Path-scoped rules cost nothing until relevant, which is what keeps the
always-loaded set short enough to actually be followed.

### 2. Hooks, because rules are advisory

Claude Code's own docs are explicit that rules are "guidance Claude reads, not
configuration Claude Code enforces." So the two things that must always happen
are hooks, not instructions:

- **PostToolUse** on `Edit|Write|NotebookEdit` runs
  `scripts/hooks/format-edited-file.sh`: ESLint `--fix` then Prettier, on the one
  edited file. It swallows failures on purpose — a hook that blocks on an
  unfixable lint error stops work mid-edit, and `npm run validate` is the gate.
- **Stop** runs `scripts/hooks/verify-turn.sh`: typecheck plus
  `jest --findRelatedTests` on what changed, exiting **2** so the failure reaches
  Claude. It skips immediately when no TypeScript changed, and honours
  `stop_hook_active` so a failing turn cannot loop.

Hook logic lives in `scripts/hooks/` rather than inline in settings, so it is
readable, reviewable, and tested by `scripts/hooks/hooks.test.sh` (9 cases).

### 3. Permissions, because some mistakes are not recoverable

`.claude/settings.json` denies reads of `.env`, `.env.*`, and `keys/**`, and asks
before `eas build|submit|update|credentials`, `git push`, and writing `gh`
commands. Reads of `.env.example` are carved back out with a gitignore negation
(`Read(!.env.example)`), which the permissions syntax supports — without it the
`.env.*` deny would also hide the placeholder file agents legitimately need.

### 4. Subagents for work that needs a different incentive

- **`test-writer`** writes tests and is forbidden implementation code. An agent
  that can write both will quietly reshape the test to match the code it already
  wrote.
- **`security-reviewer`** and **`code-reviewer`** are read-only and review a
  diff. Separating review from authorship means the reviewer has no sunk cost in
  the change.

And workflow skills — `new-feature`, `tdd-cycle`, `add-dependency`, `release` —
encode the order of operations, since the order is where agents cut corners.
`new-feature` refuses to start without an approved spec.

## Consequences

### Good

- The rules that must hold are enforced by hooks and permissions; the rest is
  guidance where guidance is enough.
- Context stays cheap: one ~134-line rulebook plus whichever topic rule is
  relevant.
- Review has an adversary. A reviewer that did not write the code asks different
  questions.
- Hook behavior is tested, so a broken hook is a failing test rather than a
  silent no-op.

### Bad

- The Stop hook costs a typecheck plus a targeted test run on any turn that
  touched TypeScript — a few seconds, every turn. It is gated to skip when
  nothing relevant changed, but it is not free.
- Four config surfaces (`AGENTS.md`, rules, agents, skills) can drift from each
  other and from the code. `AGENTS.md` is canonical; the rest must not restate
  it.
- `ask` rules are advisory against a determined agent: the docs note
  `Bash(git push *)` does not match `git -C . push origin main`. These rules stop
  accidents, not adversaries.
- Read-only reviewers still hold `Bash`, which they need for `git diff` and
  `npm run lint`. Their instructions forbid state changes, but the tool grant
  cannot express "read-only shell".

### Neutral

- `.claude/settings.json` carries no comments — Claude Code settings are strict
  JSON, where a `//` is a syntax error. The reasoning therefore lives here and
  in `AGENTS.md` rather than beside the rules.

## Alternatives considered

| Option                                             | Why not                                                                                                    |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| One large `CLAUDE.md`                              | Loads every session, competes for context, and gets skimmed. The docs recommend splitting past ~200 lines. |
| Rules only, no hooks                               | Rules are advisory by design. Formatting and turn verification must be guaranteed.                         |
| Hooks only, no rules                               | Hooks catch mechanical problems and cannot express judgement ("assert behavior, not internals").           |
| Let one agent write tests and implementation       | The test bends to fit the code. Splitting the role is the point.                                           |
| `permissions.defaultMode: "acceptEdits"` for speed | Trades the review surface for throughput on a security-first app. Not worth it.                            |
| A pre-commit hook instead of the Stop hook         | Fires too late: the agent has already finished and reported success.                                       |

## Verification

- `scripts/hooks/hooks.test.sh` — 9 cases covering payload parsing, extension
  filtering, missing files, malformed JSON, and the `stop_hook_active` guard.
- The edit hook was confirmed live by making a deliberately misformatted edit and
  watching it come back formatted.
- `npm run validate` passes with all of the above in place.
- `/context` in a fresh session shows `CLAUDE.md` and the always-loaded
  architecture rule; `/plugin`, `/mcp`, `/hooks`, and `/doctor` confirm the rest.
