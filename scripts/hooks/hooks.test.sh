#!/usr/bin/env bash
# Tests for the Claude Code hook scripts. Plain bash so it can run anywhere,
# including before node_modules exists.
#
#   ./scripts/hooks/hooks.test.sh
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FORMAT="$ROOT/scripts/hooks/format-edited-file.sh"
VERIFY="$ROOT/scripts/hooks/verify-turn.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pass=0
fail=0
check() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$expected" == "$actual" ]]; then
    printf '  ok    %s\n' "$label"
    pass=$((pass + 1))
  else
    printf '  FAIL  %s (expected %s, got %s)\n' "$label" "$expected" "$actual"
    fail=$((fail + 1))
  fi
}

echo "format-edited-file.sh"

# Formats a badly formatted TS file in place.
target="$ROOT/scripts/hooks/.fixture-format.ts"
printf 'export const x   =    {a:1,b:2}\n' > "$target"
"$FORMAT" "$target" >/dev/null 2>&1
if grep -q 'export const x = { a: 1, b: 2 };' "$target"; then
  check "formats a TypeScript file" "formatted" "formatted"
else
  check "formats a TypeScript file" "formatted" "unchanged: $(cat "$target")"
fi
rm -f "$target"

# Reads the path out of a PostToolUse payload on stdin.
target="$ROOT/scripts/hooks/.fixture-stdin.ts"
printf 'export const y   =   1\n' > "$target"
printf '{"tool_input":{"file_path":"%s"}}' "$target" | "$FORMAT" >/dev/null 2>&1
if grep -q 'export const y = 1;' "$target"; then
  check "reads file_path from stdin payload" "formatted" "formatted"
else
  check "reads file_path from stdin payload" "formatted" "unchanged: $(cat "$target")"
fi
rm -f "$target"

# Ignores files it has no business touching.
printf 'not  json  at  all\n' > "$TMP/notes.txt"
before="$(cat "$TMP/notes.txt")"
"$FORMAT" "$TMP/notes.txt" >/dev/null 2>&1
check "leaves unsupported extensions alone" "$before" "$(cat "$TMP/notes.txt")"

# Missing file, deleted file, and malformed payload must all be no-ops.
"$FORMAT" "$TMP/does-not-exist.ts" >/dev/null 2>&1
check "exits 0 for a missing file" "0" "$?"
printf 'not json' | "$FORMAT" >/dev/null 2>&1
check "exits 0 for a malformed payload" "0" "$?"
printf '' | "$FORMAT" >/dev/null 2>&1
check "exits 0 for an empty payload" "0" "$?"

echo "verify-turn.sh"

printf '{"stop_hook_active":true}' | "$VERIFY" >/dev/null 2>&1
check "skips when stop_hook_active is true" "0" "$?"

"$VERIFY" --files >/dev/null 2>&1
check "exits 0 when nothing changed" "0" "$?"

"$VERIFY" --files README.md docs/PROJECT.md >/dev/null 2>&1
check "exits 0 when no TypeScript changed" "0" "$?"

printf '\n%d passed, %d failed\n' "$pass" "$fail"
[[ $fail -eq 0 ]]
