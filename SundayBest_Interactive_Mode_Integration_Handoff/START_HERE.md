# SundayBest — Safe V3 API integration handoff

**Based on Archive(5).zip, 2026-10-25.** The source files from the prior V3 proposal are included unchanged in `v3_reference/`. **This package is not a completed API integration; do not overwrite the entire API or treat these instructions as already deployed.**

## Already in Archive(5).zip — leave alone
- Three-stage outline → day → optional quiz generation with checkpoints, retries and reuse.
- Reader output: heading/paragraphs, Scripture, reflection questions, prayer, sermon clips, supporting Scriptures.
- Zod structured validation, Bible BSB/KJV verification, transcript quotes, and caching/token usage tracking.
- Existing plan/student API response shapes and old plans.

## Files you can add immediately (no behavior changes until wired)
- `v3_reference/generation/formation-prompt.ts` → `src/generation/prompts/formation.ts` (adjust import path).
- `v3_reference/generation/formation-schema.ts` → `src/generation/formation-schema.ts`.
- `v3_reference/generation/formation-icons.ts` → `src/generation/formation-icons.ts`.
- `v3_reference/frontend/formation-icons-native.ts` → new React Native app; verify icon exports in your installed Lucide version.
- `assets/sculptural_asset_mapping.json` → reference only: map API's Lucide semantic names to approved sculptural PNGs; use local Lucide fallback for symbols without finished artwork.

## Changes required in existing API — in this order
1. **Prompt correction:** in `src/generation/prompts/custom.ts`, ensure `selectInstructions()` appends custom brand voice to **all standard rules**. Exact optional patch in `patches/`. Retire the custom direction to impersonate a preacher; preserve authentic quotations with attribution instead.
2. **Outline:** `src/generation/stages/outline.ts` schema/output/mapping adds `formation` and `days[].mapNodes`; `src/generation/prompts/outline.ts` composes formation addendum. Reject unknown IDs and ensure all core outcomes appear at every 1–7-day length.
3. **Day:** `src/generation/stages/day.ts` adds `encounters` + exactly 10 commitment choices **per day**, and preserves existing Reader payload; `src/generation/prompts/day.ts` composes day addendum. Each encounter maps to precisely one known mapNode.
4. **Assembly:** `src/generation/schema.ts`, `pipeline.ts`, and `validation.ts` carry, validate and persist both paths. Keep Quiz unchanged. Bible-reference discovery needs explicit support in preflight, outline/source attribution, and Scripture validation; do not simply lift the sermon-chapter restriction with no safeguards.
5. **Version bump:** `src/generation/prompts/version.ts` bump `GENERATOR_VERSION` and `PROMPT_VERSION` together to keep old reused plans separate from new generated structure.
6. **Database:** review `migration/0011_journey_additive_DRAFT.sql` and mirror it in `src/db/schema.ts`. `plans.formation` and `plan_days.journey` are nullable JSONB; old plans remain Reader-only. User commitment events live in a **private user-scoped** table, not shared plan rows.
7. **Worker + reuse:** `src/worker/generation-worker.ts` writes the new fields; `src/worker/reuse-plan.ts` includes them in plan reuse. Do not drop legacy paragraph, Scripture, prayer, quiz, or reflection writes.
8. **API:** add optional `formation` / `journey` to `src/contracts/plans.ts`, `src/contracts/study.ts` and the read services. Old plans should return null. Add authenticated commitment select/check-in endpoints with ownership and idempotency checks.
9. **Completion:** `src/services/study-service.ts` currently requires four Reader steps. Add a separate interactive completion path; NEVER mark Reader steps completed based on opening map nodes or selecting a commitment. Keep one canonical day-completion record.
10. **New app:** keep Reader UI unchanged. Show Interactive map if `journey != null`; fallback to Reader for old plans. Map semantic icon IDs to your approved local assets; no OpenAI image generation. Choose one locally assigned board for the entire plan (stable hash of plan ID, not regenerated each day).

## Compatibility contract
- `GET /v1/plans/:planId/days/:dayNumber`: retain current response keys (`reading`, `scripture`, `supportingScriptures`, `reflectionPrompts`, `prayer`, `quickCheckId`, `progress`) and ADD `journey?: ... | null`.
- Add `formation?: ... | null` at plan level, with legacy fallback. No route rename or required new field for old app versions.
- Existing Reader completion route and `completedSteps` must stay unchanged; introduce mode-aware Interactive completion separately.
- Visual assets: initial `eye`, `brain`, `speech`→mouth, `shield`, `heart`. The 87-icon Lucide enum in V3 is a **semantic fallback**, not the final 120-object sculptural art taxonomy. Expand intentionally with backend+app registry versioning.
- Use 1–5 encounters/day as V3 generation default; visual map accepts up to 7 nodes per day.

## Release checks BEFORE shipping
- Typecheck and run existing generation / validation / REST / database tests.
- Generate a 1-day and a 7-day sample and confirm identical essential outcomes are covered.
- Test old plan: Reader works and `journey=null`.
- Test new plan: Reader and Interactive show the same Scripture and source, with no fake completion between views.
- Test Bible validation rejects nonexistent or contextually unsupported supplemental references.
- Test plan reuse preserves formation and per-day journey data.
- Test commitment access only for owner; status is **self-reported**, never proof of spiritual development.
- Verify prompt cached-token telemetry after stable-prefix changes.

**Status:** V3 is a proposed additive design, not a runnable integrated patch. The prompt-override change has an exact source-based patch; database DDL is a reviewable draft and must be incorporated/tested in your Drizzle setup. No production deployment or full application test has been performed here.
