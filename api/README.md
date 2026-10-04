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

The API paths and response shapes match `src/core/api/contracts/*` and `src/core/api/sundaybest-api.ts` in the repo root. User identity, onboarding, settings, reminders, Home plan data, Plans, Plan Detail, and Progress are now API-backed through TanStack Query. Daily Study and Quick Check content/progress remain on the legacy local path until the next migration slice, so real server plan IDs are deliberately not sent into that store.

The API uses `X-Client-Timezone` (IANA timezone, e.g. `America/New_York`) to enforce daily plan pacing. The mobile transport sends this automatically. For a physical iPhone in Expo Go, point `EXPO_PUBLIC_API_URL` at the Mac's reachable Bonjour/LAN host (for example `http://Walters-MacBook-Pro.local:4100`).

## App Attest

Set `APP_ATTEST_TEAM_ID` and `APP_ATTEST_BUNDLE_ID` to the values registered with Apple. Development-signed iOS builds need `APP_ATTEST_ALLOW_DEVELOPMENT=true`; production should set it to `false`.

The server verifies attestation objects, stores the attested public key, verifies assertions, and enforces the monotonically increasing App Attest counter. One-time challenges are hashed in PostgreSQL and consumed exactly once. High-value mutations (account deletion plus plan generation/retry) bind the assertion to the HTTP method, path, and canonical request body, so a valid assertion cannot be reused for a different request.

## External content providers

The backend intentionally does **not** invent a transcript, copyrighted Bible translation, or AI-generated study content in production. These adapters are explicit configuration boundaries:

- `TRANSCRIPT_PROVIDER_URL`
- `PLAN_GENERATION_PROVIDER_URL`
- `BIBLE_PROVIDER_URL`
- `YOUTUBE_API_KEY` — optional during local development; enables live YouTube results for `GET /v1/sermons/search` in addition to the local sermon catalog

Each can point at your chosen provider or at a tiny internal gateway. The provider contracts live in `src/providers/` and are Zod-validated before data is persisted. Development has a deterministic plan generator only for exercising the job pipeline; it is blocked in production.

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
- generated Scripture references are verified through the Bible provider before publish

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

Receives sermon metadata, transcript text, plan length, and whether Quick Check is enabled. It returns the generated content graph defined by `generatedPlanSchema` in `src/providers/plan-generation-provider.ts`.

### Bible gateway

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

## Production edge controls

The app server owns authentication and domain authorization. Put production traffic behind your normal TLS/reverse-proxy/WAF layer and rate-limit abuse-prone public or costly routes there, especially `/v1/attest/challenge`, `/v1/sermons/resolve`, and generation endpoints. Product-specific per-user generation quotas are intentionally not hard-coded because pricing/entitlement rules have not been defined yet.

## Health

- `GET /health/live` — process is alive
- `GET /health/ready` — process can query PostgreSQL

Run the API and open `http://localhost:4100/docs` for the canonical interactive Swagger surface, or `GET /openapi.json` for the generated OpenAPI document. See `src/docs/architecture.md` for the data-flow decisions.
