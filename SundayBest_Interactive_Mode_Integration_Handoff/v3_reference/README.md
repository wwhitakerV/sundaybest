# SundayBest — API-referenced Sermon → Formation Journey, v3

**Source audited:** `Archive(5).zip`, API `src/` (not the database contents or a production instance).

**Deliverable status:** engineering-ready additive contract, prompt addenda, and icon allowlist. These are **not an already-integrated API patch**. Existing API files are not overwritten. Integration instructions below specify exact entry points to edit. A real production migration must be implemented and tested against the original repository.

## Decision: keep the existing stack

Keep:
- `src/generation/pipeline.ts`: staged outline → parallel days → optional quizzes with checkpoints and retries.
- `src/generation/stages/{outline,day,quiz}.ts`: Reader generation and transcript/clip validity logic.
- `src/generation/schema.ts`: current generated plan structure; **add** `formation` and day `journey` data rather than replacing Reader fields.
- `src/contracts/{plans,study}.ts`: existing Read, Scripture, Reflect, Pray contracts unchanged; add nullable journey fields.
- `src/db/schema.ts`: plans, plan_days, reflection_prompts, prayers, quizzes; add JSONB journey data and per-user commitments.
- `src/worker/generation-worker.ts`: existing persistence, with additive writes.
- `src/worker/reuse-plan.ts`: preserve cross-user reuse but make it aware of new content version + formation fields.
- `src/providers/openai-stage-caller.ts`: model, store:false, usage logs, Zod structured output, cache routing.

**Critical existing defect:** `src/generation/prompts/custom.ts` has `enabled:true`. The current `selectInstructions()` replaces the standard RULES with the custom theory; retain brand voice by APPENDING the custom voice to standard rules, never supplanting the base safety/source quality rules.

## New canonical plan object (additive)

`GeneratedPlan` plus:
- `formation: { formationThesis: string, outcomes: FormationOutcome[] }` — core 1–5 once per plan.
- Each day has `journey: { mapNodes: FormationMapNode[], encounters: FormationEncounter[], commitments: FormationCommitment[] }`.
- Existing generated day fields remain intact: `readingTitle`, `focus`, `readingParagraphs`, `scripture`, `supportingScriptures`, `reflections`, `prayer`, sermon quote/clip, `quickCheck`.

Pipeline roles:
1. **Outline** analyzes the whole transcript once and generates current outline fields **plus** canonical formation outcomes and days[].mapNodes.
2. **Day** receives existing outline/day data **plus only relevant formation outcome/mapNodes** and generates current Reader fields **plus** formation encounters/commitments. This avoids a separate large planning API call.
3. **Quiz** remains unchanged; it tests the new Reader content. Optional Quick Check unchanged.

**1–7 days:** The outline must cover every core outcome in every duration; day count affects number of practice encounters and revisit opportunities, never the list of core outcomes. Validation must fail if an outcome is absent from the journey. Prefer fewer strong nodes over fabricated filler. The generation contract targets 1–5 encounters/day, with 1 day 3–5 and 7 days ~13–21 total if source supports it.

**Ten commitment options per day, total**, associated with the day's nodes, with ≥1 per node. The user may make one commitment at each encounter; only show relevant options when the node opens. This avoids displaying 50 options on five-node days, while retaining meaningful choice. Choose and report are per-user data, not fields of the shared generated plan.

## Exact surgical edit list

1. `src/generation/prompts/custom.ts` — change `selectInstructions` so it retains `standard` and appends the custom voice. Edit style text to avoid impersonating the pastor; model should be faithful without pretending to be a specific human.
2. `src/generation/prompts/rules.ts` — update only goals, progression, Scripture allowance and length language. Keep existing Reader voice, quote, timestamp, quiz, and Scripture text rules.
3. `src/generation/prompts/outline.ts` — append `OUTLINE_FORMATION_ADDENDUM`, extend output field instructions and task context.
4. `src/generation/stages/outline.ts` — extend model-facing `outlineOutputSchema` to include `formation` and days[].mapNodes; validate 1–5 core outcomes, 1–5 nodes/day, unique IDs, and union of outcomes across all days.
5. `src/generation/prompts/day.ts` — append `DAY_FORMATION_ADDENDUM`; task should provide this day's mapNodes + related outcome definitions. Retain Reader requirements.
6. `src/generation/stages/day.ts` — add day `journey` output field with encounters and 10 total commitment candidates; validate node IDs and partitions. Keep current `mapDay` quote/scripture logic.
7. `src/generation/schema.ts` — extend `generatedPlanSchema` and `generatedDaySchema` with the validated formation data. Import schemas from new `formation-schema.ts`.
8. `src/generation/pipeline.ts` — stitch formation from the existing outline and day steps, update `assemble`; do not add an independent OpenAI call per icon.
9. `src/generation/validation.ts` — check all outcome/node relations and 10/day commitment constraints plus Scripture context/bundled-text checks.
10. `src/generation/prompts/version.ts` — bump generator and prompt versions. Existing `findReusablePlan` keys off both; this isolates new plans from old payloads.
11. `src/db/schema.ts`, new Drizzle SQL migration — `plans.formation JSONB` nullable for legacy plans; `plan_days.journey JSONB` nullable for legacy plans. Add a separate user-scoped `journey_commitment_events` table keyed to user and day (committed, checked-in, self-reported status). Avoid storing user choices on shared plan rows.
12. `src/worker/generation-worker.ts` and `src/worker/reuse-plan.ts` — round-trip the new fields; reuse must not omit them. Existing Reader, prayers, quiz and reflection writes remain unchanged.
13. `src/contracts/study.ts` / `src/contracts/plans.ts` / `src/services/study-service.ts` — add optional/nullable response fields with safe defaults for legacy plans, no changes to current Reader fields. Existing `GET /v1/plans/:planId/days/:dayNumber` can return the map and Reader from the same response.
14. New authenticated commitment endpoints, idempotent writes, query for selected action and follow-up. Do not set `completedSteps` when someone merely chooses an interactive node.
15. `src/services/study-service.ts`: day completion currently enforces Read→Scripture→Reflect→Pray and optional Quick Check. Explicitly support interactive completion separately; never treat map interaction as fake Reader completion. Enforce one day completion record with distinct evidence of mode-specific activity.
16. Frontend: keep StudyScreen reader UI, add `Interactive` map UI and deterministic recap animation, and wire to the same day, Scripture, prayer and commitment state.

## Supplemental Scripture — exact edge cases

Current `src/generation/pipeline.ts` rejects sermons with zero explicitly named chapters. Current `stages/outline.ts` requires a primary chapter named in transcript; `validation.ts` enforces the same; `supporting.ts` already accepts limited verified supplementals. Do **not** merely change prompting and assume newly discovered Scriptures will work.

For sermons that cite Scripture: preserve the named primary passage. Add relevant, verified supplemental passages for encounters. Mark origin as sermon/supplemental and never attribute supplemental passages to the pastor.

For sermons with no explicit chapter: if the sermon is otherwise biblically substantive, permit a **separately marked supplemental primary passage** after verification. This requires changing the preflight guard, outline mapper, structure validator, and source-attribution model together. If biblical content cannot be established reliably, reject rather than inventing it. `about.scripturesReferenced` remains only actual sermon citations, even if empty, and must not be forced to include a supplemental primary.

All book/chapter/verses must resolve via bundled BSB/KJV; existing `readsInEveryBundledTranslation` is a great starting point. Passage existence does not prove contextual relevance: maintain a separate theological relevance evaluator/test fixtures.

## Commitment history should store only claims it can know

Recommended user event: `userId`, `planDayId`, `nodeId`, `commitmentId`, `chosenAt`, `status?`, `checkedInAt?`, `generationVersion`; statuses: `committed`, `followedThrough`, `attempted`, `notYet`, `noOpportunity` (self-reported). Do not mark fruit/holiness "achieved".

Keep source-grounded statements only: "You committed to..."; "You said you tried...". Store absolute UTC instants; render "yesterday" via reader timezone at presentation. User choice should be private by default; never include it in share movie unless user explicitly opts in.

## Icon registry

`generation/formation-icons.ts` is the ENTIRE curated allowlist: **87 exact Lucide kebab-case names**, organized by faculty, trait, practice, vigilance, discernment, time, service, etc. The language model must select from the schema enum, not invent icon strings. The backend does not depend on React Native. `frontend/formation-icons-native.ts` is a static-map example for `lucide-react-native`; avoid dynamic require/import of every icon.

To expand, modify enum and native map together, bump prompt/schema version, and add a test asserting every enum icon has a static RN component. Do not send icon display SVGs, paths, or the entire 1,900+ icon catalog to OpenAI.

## OpenAI account optimization (Oct 2026)

- **Avoid new dashboard prompt objects.** OpenAI is deprecating `/v1/prompts` on Nov 30, 2026. Store long-lived SundayBest instructions and icon taxonomy in versioned files, which you already do.
- **Cache static prefixes.** Today your caller uses `system preamble → user transcript → system stage instructions → user task`. That is good for caching the identical sermon across its stages, but a static global policy placed BEFORE the transcript would also allow cross-sermon prefix reuse. Measure the actual cached tokens after changing message order; beware model-dependent behavior.
- **For GPT-5.6+ only**, explicit caching supports prompt_cache_options and explicit breakpoints. Older supported models rely on implicit behavior. Cache writes may carry a premium; don't blindly force explicit caching on short requests or on changing suffixes. Apply feature flags and measure before switching.
- **No magic persistent account training.** OpenAI does not automatically remember SundayBest instructions or learn from your users across requests. Prompt caching stores reusable compute prefixes, not a trained brand model.
- **Nightly brand policy**: run a separate aggregation/evaluation workflow (not on each sermon call), using privacy-preserving consented outcomes. Revise and publish `formation-policy-v#` only after human/automated quality checks. The default quality policy should already work for the first users.
- **No mandatory fine-tune** for MVP. Fine-tuning (if supported by the chosen model and justified by opt-in, high-quality labeled examples) is a later controlled experiment, not a replacement for scripture verification or a cheap first step.
- **Preserve metrics** already available in `generation_attempts`: input, cached, output, reasoning tokens, duration, errors per stage, retry rates, quality rejects. Use controlled test sermons of lengths 1, 3, 7 days for A/B cost and faithfulness evaluation.
- **Idempotent shared generation**: cached/reused sermon content is reusable; a person's commitment choices are not. Include `formationPolicyVersion` and icon/schema revisions in generation/reuse identity.

## Validation before production

1. Test 1,2,3,4,5,6,7 days with same transcript. All core outcomes appear in each.
2. Test a short sermon with only one defensible formation outcome: don't invent extras.
3. Test sermons with one named verse, one named chapter, and no named Scripture.
4. Test a sermon with a wrong biblical claim or a misleading sermon-only reference; ensure flagging/review.
5. Test supplemental references where passage exists but meaning isn't relevant.
6. Test 5 nodes/day and exactly 10 choices/day with at least one per node.
7. Test legacy Reader plans still parse through current API, including cached offline study days.
8. Test reusing plans with the new generator version and across users; no user-specific choices leak.
9. Test the same day visited in Reader and Interactive, with one completion state and no fake step progress.
10. Verify actual Lucide named exports in the frontend installed package and render all registry icons.
11. Measure per-stage cache hit rates and token costs before/after changing prefix order.
12. Run existing `npm run validate` against installed dependencies and perform real BSB/KJV/SQLite/Postgres integration checks.

## Included files

- `generation/formation-icons.ts` — curated icon list (87, API-side only).
- `generation/formation-schema.ts` — Zod 4-compatible, additive stage schemas and referential checks.
- `generation/formation-prompt.ts` — formation-specific rules to **append** to existing staged prompts.
- `frontend/formation-icons-native.ts` — static Lucide mapping for the RN client.
- `notes/OPENAI-REFERENCES.md` — official current API documentation and platform decisions.

These files intentionally **do not** replace current API modules without migration. That avoids breaking the Reader UI and the shipped client contract.
