# SundayBest API

Production-oriented REST backend for SundayBest. This workspace is intentionally separate from the Expo package so server dependencies never enter the mobile bundle.

## Stack

- Node 24 + TypeScript
- Fastify 5
- PostgreSQL
- Drizzle ORM schema + committed SQL migrations
- Zod request/response contracts
- Apple App Attest verification via `node-app-attest`
- JOSE-signed short-lived access JWTs + rotating opaque refresh tokens
- PostgreSQL-backed generation queue and a separate worker process

## Local start

```bash
cd api
cp .env.example .env
docker compose up -d postgres
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

In a second terminal:

```bash
cd api
npm run dev:worker
```

The API listens on `http://localhost:4100` by default. This repo maps the Docker PostgreSQL container to host port `5433` (`5433:5432`) so it does not collide with the existing Postgres.app instance on host port 5432. Keep `DATABASE_URL=postgres://sundaybest:sundaybest@localhost:5433/sundaybest` in your local `.env`.

### Development session

Expo Go cannot mint App Attest credentials for the SundayBest bundle. With `NODE_ENV=development` and `DEV_SESSION_ENABLED=true`, `POST /v1/dev/session` creates an anonymous development install and returns normal access/refresh credentials. Supplying the same `installationId` reuses the same anonymous user, which lets a physical Expo Go install survive reloads without manufacturing a new user. This endpoint is not registered in production and production startup rejects `DEV_SESSION_ENABLED=true`.

## Mobile integration

The API paths and response shapes match `src/core/api/contracts/*` and `src/core/api/sundaybest-api.ts` in the repo root. User identity, settings, plans, progress, Daily Study, Quick Check, sermon discovery, and generation are API-backed through TanStack Query. Phase 5 adds an explicit SQLite/SQLCipher resource cache plus an ordered idempotent mutation outbox for offline study progress; private reflection answers remain device-only and never enter the outbox.

The API uses `X-Client-Timezone` (IANA timezone, e.g. `America/New_York`) to enforce daily plan pacing. The mobile transport sends this automatically. For a physical iPhone in Expo Go, point `EXPO_PUBLIC_API_URL` at the Mac's reachable Bonjour/LAN host (for example `http://Walters-MacBook-Pro.local:4100`).

## App Attest

Set `APP_ATTEST_TEAM_ID` and `APP_ATTEST_BUNDLE_ID` to the values registered with Apple. Development-signed iOS builds need `APP_ATTEST_ALLOW_DEVELOPMENT=true`; production should set it to `false`.

The server verifies attestation objects, stores the attested public key, verifies assertions, and enforces the monotonically increasing App Attest counter. One-time challenges are hashed in PostgreSQL and consumed exactly once. High-value mutations (account deletion plus plan generation/retry) bind the assertion to the HTTP method, path, and canonical request body, so a valid assertion cannot be reused for a different request.


## Production environment gates

`NODE_ENV=production` fails startup when development App Attest certificates or development sessions are enabled, when Supadata / plan-generation providers are missing, or when any configured external provider uses plaintext HTTP. Keep all provider credentials server-side; none belong in the Expo `EXPO_PUBLIC_*` namespace.

The server trusts no forwarded proxy hops by default (`TRUST_PROXY_HOPS=0`). Set the exact hop count only when deployment topology requires it.

## External content providers

YouTube discovery, metadata, and transcripts are routed through Supadata. Set this only on the API/worker process:

- `SUPADATA_API_KEY` — required for live YouTube search/resolve/transcripts
- `SUPADATA_BASE_URL` — defaults to `https://api.supadata.ai/v1`

The worker uses Supadata's universal `/transcript` endpoint in `auto` mode and handles both immediate transcript responses and asynchronous transcript jobs. Transcript segments are persisted once per sermon, so regenerating or sharing the same sermon does not spend another transcript request unless the local transcript is absent. Search uses `/youtube/search`; single-video metadata uses `/metadata`. A pasted link to a sermon whose details were fetched in the last week is answered from the database without calling `/metadata`. A search term asked in the last day is answered from the videos Supadata returned the first time (`sermon_searches`: the term and video ids, never who searched; rows older than a day are deleted on the next search).

OpenAI plan generation is direct and staged: a plan call, then one call per day, then one quiz call per day, each verified before the next (see `docs/adr/0020-staged-plan-generation.md`). `npm run generation:attempts [generationId]` prints every call: its step, outcome, reason and tokens, including how many input tokens OpenAI billed at its cached rate. Before any model call, a transcript that barely names or reads Scripture fails the plan with `unsupportedSource` (see `docs/adr/0022-plans-need-scripture.md`). A request for the same sermon and length as a finished plan copies that plan instead of generating, dropping its quizzes or writing only the quizzes as Quick Check requires, while a reader asking again for a sermon they already have gets a second plan, written fresh — never copied from their own — unless one is still building, which opens instead (see `docs/adr/0021-reuse-generated-plans.md` and its amendment). `POST /v1/plans/:planId/reset` takes a plan back to not started for the reader — progress, steps and quiz attempts cleared, its content untouched — and returns the plan's reflection ids so the app can clear the answers it keeps on the phone. Accepted steps are kept in `generation_steps` until the plan is published, so a retry resumes where the last run stopped; bump `PROMPT_VERSION` in `src/generation/prompts/version.ts` whenever a prompt change should produce new plans. Set `OPENAI_API_KEY` in the server/worker environment. `OPENAI_MODEL` defaults to the V0 model, `gpt-5.6-luna`; `OPENAI_TIMEOUT_MS` defaults to 180000 and `OPENAI_MAX_COMPLETION_TOKENS` to 24000. The SDK has no automatic retries; the existing job queue owns bounded retries.

The remaining optional/required provider boundaries are:

- `PLAN_GENERATION_PROVIDER_URL` — optional explicit override for deployments using a generation gateway; leave blank for direct OpenAI
- `BIBLE_PROVIDER_URL` — optional licensed gateway for NIV, ESV and NLT; BSB and KJV are bundled (`data/bible/`, `src/bible/`) and need no provider
- `TRANSCRIPT_PROVIDER_URL` — optional override if a deployment intentionally uses a custom transcript gateway instead of Supadata

All provider responses are validated before persistence. Missing OpenAI configuration fails generation instead of silently creating fixture content. `DEV_PLAN_GENERATION_ENABLED=true` explicitly enables the deterministic fixture generator only outside production.

Read [PIPELINE_SETUP.md](PIPELINE_SETUP.md) for installation, live verification, changed files, and the Bible gateway requirement.

## Data rules enforced server-side

- anonymous install owns a user identity; future account linking can attach to it without changing the user ID
- reusable plan content is separate from per-user enrollment/progress
- future days are visible but cannot be studied until their scheduled local date
- earlier days must be complete before a later day is studyable
- `Read → Scripture → Reflect → Pray` is enforced in order
- when Quick Check is enabled, the day cannot complete until the quiz attempt is complete
- Quick Check cannot start before Pray
- reflection answers are intentionally absent from the server schema
- user identity comes from the access token, never a client-supplied `userId`
- mutable endpoints require `Idempotency-Key`
- plan-creation request keys are also stored on generation rows so a process crash cannot create duplicate plans on retry
- answer keys are never returned with unanswered quiz questions
- generated sermon quotes must be found in the source transcript before publish
- generated Scripture references need a named reference/chapter in the transcript and must have text in every bundled translation before publish
- generated OpenAI Scripture citations and sermon-source quiz answers include exact source evidence that is checked and removed during mapping
- quote clips require usable source timing and stay within the transcript/video bounds
- day count, day order, Quick Check setting, one-correct-answer keys, distinct choices and non-repeated question/reflection prompts are checked before publication
- each Quick Check has 7–10 questions with exactly four choices
- About This Plan (overview, Scriptures referenced, key takeaways) is generated with the plan, stored on `plans.about`, and returned only on plan detail; every Scripture it lists must be named in the transcript, and each day's passage chapter is always listed
- missing captions, unavailable sermons and missing provider configuration fail the generation at once instead of being retried automatically
- generated quizzes use translation-neutral multiple choice; verse-completion generation is rejected until a translation-specific source is available

## Database changes

`src/db/schema.ts` is the application schema. `drizzle/*.sql` is the committed migration history.

For a new schema change, update `src/db/schema.ts`, add a new numbered SQL file under `drizzle/`, review it, then run:

```bash
npm run db:migrate
```

`npm run db:push` is available only for disposable/local schema iteration. Never use push as the production migration mechanism, and never edit an already-deployed numbered migration.

## Provider contracts

### Transcript gateway

`POST TRANSCRIPT_PROVIDER_URL`

Request contains sermon metadata. Response:

```json
{
  "language": "en",
  "kind": "captions",
  "segments": [{ "startMs": 0, "endMs": 3200, "text": "..." }]
}
```

### Plan-generation gateway

`POST PLAN_GENERATION_PROVIDER_URL`

Receives sermon metadata, timestamp-aware transcript text, raw transcript segments, plan length, and whether Quick Check is enabled. It returns the generated content graph, including `about`, defined by `generatedPlanSchema` in `src/generation/schema.ts` (also re-exported from `src/providers/plan-generation-provider.ts`). A gateway must return real provider metadata and satisfy the same grounding and structural checks.

### Bible gateway

Used only for translations that are not bundled (NIV, ESV, NLT), and only once they are licensed. BSB and KJV are served from `data/bible/` in memory, with no network call or database row.

`POST BIBLE_PROVIDER_URL`

```json
{ "reference": "John 3:16-18", "translation": "NIV" }
```

Response:

```json
{
  "reference": "John 3:16-18",
  "translation": "NIV",
  "provider": "licensed-provider-name",
  "providerVersion": "optional",
  "cacheAllowed": false,
  "verses": [{ "number": 16, "text": "..." }]
}
```

If `cacheAllowed` is false the server returns the passage without persisting copyrighted text.

## Production traffic controls

The app server owns authentication and domain authorization. Production should still sit behind a TLS reverse proxy/WAF, but the API now also has a bounded in-process fixed-window limiter as a backstop if the edge rule is bypassed or misconfigured.

Configure the proxy boundary precisely with `TRUST_PROXY_HOPS` (`0` means Fastify is directly reachable). Do not set a larger number than the real proxy chain: `request.ip` is the rate-limit key, and trusting extra forwarded hops lets a client spoof it.

The default one-minute buckets are:

- general API traffic: `RATE_LIMIT_DEFAULT_MAX=240`
- session/App Attest bootstrap: `RATE_LIMIT_AUTH_MAX=30`
- sermon search/resolve: `RATE_LIMIT_SEARCH_MAX=60`
- plan generation/retry: `RATE_LIMIT_GENERATION_MAX=12`

`RATE_LIMIT_WINDOW_MS` changes the shared window. These limits are per API process, not a replacement for a distributed edge/WAF limit. Product-specific per-user generation quotas are intentionally not hard-coded because pricing/entitlement rules have not been defined yet.

Automatic Fastify request logging is disabled. Completion logs use the matched route template (for example `/v1/sermons/search`) rather than the raw URL, so sermon search text in query strings is not written to logs. `/v1/*` responses also send `Cache-Control: no-store`.

## Health

- `GET /health/live` — process is alive
- `GET /health/ready` — process can query PostgreSQL

Run the API and open `http://localhost:4100/docs` for the canonical interactive Swagger surface, or `GET /openapi.json` for the generated OpenAPI document. See `src/docs/architecture.md` for the data-flow decisions.
