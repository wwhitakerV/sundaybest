# SundayBest real sermon pipeline

## Install this update

This is the complete API project. Merge its contents into your existing API folder, retaining your current `.env` and database. The frontend source does not need replacement: its sermon, plan, study, quiz and generation contracts match this API after import-extension normalization.

From the API folder:

```bash
npm ci
npm run db:migrate
npm run validate
```

No new database migration is needed by this change. Existing migrations remain included for new installations. The committed `dist/` is rebuilt from the updated source, but development should use `npm run dev` and `npm run dev:worker`.

## Required configuration

Keep your current database, JWT and App Attest configuration. Add these to your server/worker `.env`:

```dotenv
SUPADATA_API_KEY=your_existing_supadata_key
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.6-luna
DEV_PLAN_GENERATION_ENABLED=false
```

Leave `PLAN_GENERATION_PROVIDER_URL` blank to use OpenAI directly. If it is set, the explicit generation gateway takes precedence. `TRANSCRIPT_PROVIDER_URL` also remains an optional explicit override; blank uses Supadata.

**The Bible provider is still a real dependency.** Configure `BIBLE_PROVIDER_URL` and, if needed, `BIBLE_PROVIDER_TOKEN` using the existing gateway contract in README.md. It must return KJV for validation and the user's selected translation for study (NIV is the existing default). This update does not provide a hosted Bible gateway or license credentials. Without it, arbitrary real plans fail validation rather than publishing invented verse text. The old development-only Psalm 119:105 fixture is not a general Bible provider. Your Supadata/OpenAI keys alone do not supply NIV verse text.

For Expo Go, retain `NODE_ENV=development` and `DEV_SESSION_ENABLED=true`. Keep all Supadata/OpenAI/Bible credentials on the API/worker; none belong in `EXPO_PUBLIC_*`. `.env.example` contains a complete local configuration template for new installations. For an existing project, retain your current `.env` rather than overwriting it.

Start both processes in separate terminals:

```bash
npm run dev
```

```bash
npm run dev:worker
```

## Live verification

With API, worker and PostgreSQL running, use a real sermon URL:

```bash
npm run smoke:plan -- 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID' --days 1 --quiz on --study
```

Then verify the longer/no-quiz path:

```bash
npm run smoke:plan -- 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID' --days 7 --quiz off --study
```

The smoke script creates a new plan through the API, polls its job, validates the returned plan contract, and optionally starts the plan and fetches day 1 in the user's selected translation. It prints IDs/status/counts; it does not print credentials, transcripts, or generated study text. It uses a stable development installation by default. `--api http://localhost:4100` changes the API origin. For an authenticated native session, supply `SMOKE_ACCESS_TOKEN`; production sensitive mutations still require the app's App Attest assertions, so use the native app for production verification.

On the phone, keep your reachable `EXPO_PUBLIC_API_URL`, paste a sermon, choose days and Quick Check, and continue. The existing frontend already resolves the sermon, creates the job, polls generation, opens the ready plan, and reads the mapped study/quiz content.

## What changed

- `src/providers/plan-generation-provider.ts`: direct official OpenAI SDK with strict structured output; configurable model/token limit/timeout; refusal/incomplete/invalid-output handling; SDK retries disabled so the queue owns retry policy; safe error summaries.
- `src/generation/schema.ts` and `output-schema.ts`: destination/domain validation and model-output schema; generator metadata is assigned by the server, not requested from the model.
- `src/generation/prompt.ts`: transcript-only SundayBest instructions for exactly 1–7 requested days, Read/Scripture/Reflect/Pray, optional Quick Checks, source evidence, no invented Scripture or timing.
- `src/generation/transcript.ts`: validated/sorted caption segments and timestamp-preserving 30-second blocks; untimed content is marked explicitly.
- `src/generation/scripture.ts`: canonical book/reference mapping plus conservative recognition of fully named English numeric/spoken references and chapters. Ambiguous/unsupported references fail rather than being guessed.
- `src/generation/mapper.ts`: checks literal Scripture/sermon-question evidence, trims through schemas, assigns stable choice labels while retaining correct-answer flags, removes internal evidence, creates the existing GeneratedPlan shape.
- `src/generation/validation.ts`: day order/count, Quick Check setting, source quotes/citations, clip timing, distinct choices and one correct answer, duplicate prompts/readings, matching quiz passages, complete Bible verse-range checks.
- `src/generation/development-generator.ts`: the old deterministic fixture moved behind explicit non-production opt-in. Missing keys no longer silently produce fixture plans.
- `src/providers/supadata.ts` and `transcript-provider.ts`: explicitly request timestamp chunks, validate/normalize custom/Supadata transcripts, retain immediate and async/flat-result handling.
- `src/providers/bible-provider.ts`: reject blank, duplicate or unordered verse text/rows; retain translation and cache-permission behavior.
- `src/worker/generation-worker.ts`: format raw captions for generation, run the validation layer before publishing, reuse a complete transcript under a row lock, publish content and complete the queue atomically under worker ownership, handle failed heartbeats without an unhandled rejection.
- `src/services/generation-service.ts`: manual retry updates generation and queue state in one transaction and checks concurrent retries.
- `src/config/env.ts` / `env-schema.ts`: separate startup loading from pure parsing; add OpenAI configuration and production gates.
- `src/app.ts`: use the current Fastify logging controller and a typed proxy-hop predicate, retaining route-template logging and hop-count behavior.
- `package.json` / lockfile / tsconfig: OpenAI runtime dependency; PGlite test-only dependency; a portable test runner; live smoke command.
- `.env.example`, this guide, README and architecture documentation; new generation/provider/database integration tests; regenerated build output.

## Verification and limits

Typecheck, all 39 tests and the production build passed on this delivered source. The integration test uses an embedded PostgreSQL engine, real migrations, Drizzle queries, API handlers and the official OpenAI SDK with deterministic provider HTTP responses. It covers resolve → async captions → formatted transcript → structured generation → persistence → plan retrieval → NIV study request → Quick Check answer/completion, idempotent creation, transcript reuse, invalid generation, manual retry, committed-job recovery and stale-worker fencing.

Tests cover 1-day and 7-day plans with Quick Check on/off, missing/empty/failed captions, immediate/plain/async/flat Supadata responses, malformed outputs, refusal/truncation/auth/throttling errors, fabricated source evidence, wrong answer keys, duplicate choices/questions, clip bounds, incomplete Bible responses, and production configuration gates.

**No live Supadata/OpenAI/Bible request or physical iPhone run was performed with your credentials.** Tests establish mapping and plumbing under controlled responses; live availability, model access and actual sermon-study quality still need the supplied smoke commands and a content review. Schema and evidence checks do not establish the theological truth or semantic correctness of every generated paragraph or quiz explanation. There is no silent truncation: transcripts beyond the configured input-character limit fail; raise it deliberately for longer material. Clips require source timing. Chapter/reference recognition is intentionally conservative. Translation-specific finish-the-verse generation is rejected until translation-specific source text is supplied.

## Official references used

- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [V0 model: GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna)
- [Supadata transcript endpoint and job formats](https://docs.supadata.ai/get-transcript)
