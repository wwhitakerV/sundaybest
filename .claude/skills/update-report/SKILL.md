---
name: update-report
description: Re-audit the whole setup series and update Before-You-Start.html. Use when the user says "update my report", "update the report", "refresh my checklist", or asks for the Before-You-Start page to be brought current. Re-derives every outstanding item from the repo, not from memory.
---

Update `Before-You-Start.html` at the repo root: the operator's checklist of
everything from the 13-prompt setup series that is missing, unverified, or
waiting on a human.

The page exists because the code cannot tell the user these things. Its value is
that it is **complete and current**, so a stale entry is worse than no entry.

## Only run this when asked

The trigger is the user saying so. **Finishing other work is not a trigger** —
not even when that work changed the very files this page describes, and not at
the end of a prompt that added items to it.

If the page is stale, say so in one line and stop. Letting it go stale until
asked is the intended behaviour; refreshing it unprompted is not.

## 0. Work out what it currently covers

Read the `.meta` block near the top of `Before-You-Start.html` — it states which
prompts the page covers and when it was last updated. That is the baseline.

Then work out what has happened since:

```
git log --oneline -15
git status --short --untracked-files=all
ls docs/adr/
```

A new ADR, a new `src/core` folder, or a new section in `docs/PROJECT.md` each
mean a prompt has landed that the page does not know about.

## 1. Re-derive the items from the repo

**Never from memory, and never only from the previous version of the page.**
Something that was outstanding last time may be done now, and the whole point of
the page is that it is trustworthy. Read, in this order:

| Source                             | What to take from it                                                 |
| ---------------------------------- | -------------------------------------------------------------------- |
| `docs/SETUP_CHECKLIST.md`          | Everything needing a human: accounts, credentials, artwork, backend  |
| `docs/security/masvs-checklist.md` | Every control marked `planned`; the `n/a` ones are settled, not gaps |
| `docs/security/threat-model.md`    | Threats marked _planned_ or _accepted_                               |
| `docs/privacy/data-inventory.md`   | Anything it says a later prompt must update                          |
| `docs/PROJECT.md`                  | The "traps" sections — these become "do not fix this" entries        |
| `docs/adr/*.md`                    | The **Consequences → costs and things to watch** section of each ADR |
| The repo itself                    | See step 2                                                           |

## 2. Check the things no document records

These are the items the user cannot find any other way, and they are the most
valuable part of the page. Run them every time:

```bash
node -v && cat .nvmrc          # shell Node vs the pinned version
ls -d ios android 2>&1         # has the app ever been prebuilt?
ls eas.json 2>&1               # does a build config exist yet?
git status --porcelain --untracked-files=all | head -30
git check-ignore -v <suspicious paths>   # is .gitignore actually matching?
npm audit 2>&1 | tail -3
npm run validate >/dev/null 2>&1; echo $?
```

Also look for:

- **Files untracked but not ignored** — a `.gitignore` entry that does not match
  the real path is invisible until someone runs `git add .`. Verify with
  `git check-ignore -v`, not by reading the file.
- **Secret-shaped strings in pushed history**, not just the working tree:
  `git grep -nE "sk_live|sk_test|ghp_|AKIA|eyJ[A-Za-z0-9_-]{10,}" $(git rev-list --all) -- src` (bounded; sample commits if it is slow).
- **Modules nothing imports.** A module reachable only from its own tests is
  built but not wired, which is worth saying out loud.
- **Uncommitted work**, which is real exposure regardless of how good it is.

## 3. Update the page

Keep the existing structure: P0 wrong right now · P1 built but never proven ·
P2 before the first device build · P3 before shipping · Open (MASVS) · Settled ·
Queue.

**Rules that matter:**

1. **Checkbox `id`s are permanent.** The user's ticks are stored in
   `localStorage` keyed on `id`, so renumbering moves someone's ticks onto the
   wrong items. Append new ids (`p0-7`, `be-10`, …) and never reuse or
   renumber. If an item is genuinely resolved, delete the whole `<li>` — do not
   reassign its id.
2. **Resolved items come out, and get said in chat instead.** The page is the
   outstanding list, not a history. Tell the user what you removed and why.
3. **Keep the counts honest.** Every `.band .count` and every `.tally` number
   must match the real number of `<li>` entries. Verify, do not assume:

   ```bash
   node -e 'const s=require("fs").readFileSync("Before-You-Start.html","utf8");
   for (const g of ["p0","p1","p2","p3a","p3b","masvs"]) {
     const seg=(s.split(`data-group="${g}"`)[1]||"").split("</ul>")[0];
     console.log(g, (seg.match(/type="checkbox"/g)||[]).length);
   }'
   ```

4. **Update the `.meta` block**: the prompt range and the date.
5. **Update the Queue section** as prompts land and as their contents become
   known.
6. **Severity is about consequence, not effort.** A one-line fix that silently
   ships a production-identity build is P0. A week of backend work that blocks
   nothing until launch is P3.
7. **Write for the operator.** Each item says what is wrong, why it matters, and
   where to look. No hedging, no restating the item in the note.

## 4. Verify

The page lives in the repo, so it is subject to the gate:

```bash
npx prettier --write Before-You-Start.html
npm run validate
```

Prettier formats HTML, so an unformatted page fails `format:check` and takes
`validate` with it.

## 5. Report

One short summary: what was added, what was removed because it is now done, and
the single highest-priority item. Do not paste the page back into chat.

**Do not commit.** Leave it in the working tree — see the working agreement in
`AGENTS.md`.
