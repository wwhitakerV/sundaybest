#!/usr/bin/env bash
# Stop hook: typecheck and run the tests related to what changed this turn.
#
# Exits 2 with the failure on stderr, which is how a Stop hook surfaces a
# problem to Claude (exit 0 sends stderr only to the debug log, where Claude
# never sees it).
#
# Usage:
#   verify-turn.sh                       # reads the hook payload from stdin
#   verify-turn.sh --files a.ts b.tsx    # explicit list, used by the tests
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
cd "$ROOT" || exit 0

files=()
if [[ "${1:-}" == "--files" ]]; then
  shift
  files=("$@")
else
  payload="$(cat)"

  # Claude Code sets stop_hook_active when it is already continuing because of a
  # Stop hook. Re-running then risks a loop, so bail out.
  active="$(printf '%s' "$payload" | node -e '
    let raw = "";
    process.stdin.on("data", (c) => (raw += c));
    process.stdin.on("end", () => {
      try {
        process.stdout.write(JSON.parse(raw)?.stop_hook_active ? "1" : "");
      } catch {
        process.stdout.write("");
      }
    });
  ' 2>/dev/null)"
  [[ -n "$active" ]] && exit 0

  # Everything touched in the working tree, staged or not, plus untracked.
  while IFS= read -r line; do
    [[ -n "$line" ]] && files+=("$line")
  done < <(git status --porcelain --untracked-files=all 2>/dev/null | awk '{ print $NF }')
fi

# Only TypeScript changes are worth a typecheck and a test run.
ts_files=()
for f in "${files[@]:-}"; do
  case "$f" in
    src/*.ts | src/*.tsx | src/**/*.ts | src/**/*.tsx | test/*.ts | test/*.tsx | test/**/*.ts | test/**/*.tsx)
      [[ -f "$f" ]] && ts_files+=("$f")
      ;;
  esac
done

# Nothing relevant changed: stay out of the way. This is the common case and
# must cost nothing.
[[ ${#ts_files[@]} -gt 0 ]] || exit 0

failures=""

if ! typecheck_output="$(./node_modules/.bin/tsc --noEmit 2>&1)"; then
  failures+="Typecheck failed:\n${typecheck_output}\n\n"
fi

if ! test_output="$(./node_modules/.bin/jest --findRelatedTests "${ts_files[@]}" \
  --passWithNoTests --silent --ci 2>&1)"; then
  failures+="Related tests failed:\n${test_output}\n\n"
fi

if [[ -n "$failures" ]]; then
  {
    printf 'Turn verification failed. Fix these before finishing.\n\n'
    printf '%b' "$failures"
    printf 'Changed files checked: %s\n' "${ts_files[*]}"
  } >&2
  exit 2
fi

exit 0
