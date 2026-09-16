#!/usr/bin/env bash
# PostToolUse hook: lint-fix and format a single edited file.
#
# Claude Code passes the tool call as JSON on stdin; the edited path is at
# tool_input.file_path. A path may also be passed as $1, which is how the tests
# in scripts/hooks/hooks.test.sh drive this script.
#
# Speed matters here: this runs after every edit. It uses the local binaries
# directly (npx would add ~300ms of resolution per call) and exits early for
# anything it has no business touching.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

file="${1:-}"
if [[ -z "$file" ]]; then
  # No argument: read the hook payload from stdin. node is guaranteed by .nvmrc;
  # jq is not installed on every machine.
  payload="$(cat)"
  file="$(printf '%s' "$payload" | node -e '
    let raw = "";
    process.stdin.on("data", (c) => (raw += c));
    process.stdin.on("end", () => {
      try {
        const input = JSON.parse(raw);
        process.stdout.write(input?.tool_input?.file_path ?? "");
      } catch {
        process.stdout.write("");
      }
    });
  ' 2>/dev/null)"
fi

# Nothing to do: no path, or the edit deleted the file.
[[ -n "$file" && -f "$file" ]] || exit 0

case "$file" in
  *.ts | *.tsx | *.js | *.jsx | *.cjs | *.mjs | *.json | *.md | *.yml | *.yaml) ;;
  *) exit 0 ;;
esac

# Never touch anything outside the project, or inside generated trees.
case "$file" in
  "$ROOT"/*) ;;
  *) exit 0 ;;
esac
case "$file" in
  */node_modules/* | */.expo/* | */coverage/* | */dist/* | */ios/* | */android/*) exit 0 ;;
esac

ESLINT="$ROOT/node_modules/.bin/eslint"
PRETTIER="$ROOT/node_modules/.bin/prettier"

# ESLint first so its fixes are then formatted by Prettier, which owns layout.
# Failures are deliberately swallowed: a hook that blocks on a lint error it
# cannot fix would stop Claude mid-edit on work in progress. `npm run validate`
# is the gate that must stay green, not this.
case "$file" in
  *.ts | *.tsx | *.js | *.jsx | *.cjs | *.mjs)
    [[ -x "$ESLINT" ]] && "$ESLINT" --fix --no-warn-ignored "$file" >/dev/null 2>&1
    ;;
esac

[[ -x "$PRETTIER" ]] && "$PRETTIER" --write --log-level warn --ignore-unknown "$file" >/dev/null 2>&1

exit 0
