# Real-data API boundary

`src/core/api` is the mobile app's only network boundary.

## Shape

- `bootstrap-api.ts` owns the four unauthenticated session-establishment calls.
- `client.ts` owns authenticated transport, auth, attestation, timeouts, retries, response parsing, and idempotency headers.
- `contracts/*` are executable Zod contracts for `/v1`.
- `sundaybest-api.ts` is the typed resource façade features call.
- `query-keys.ts` is the one source of truth for TanStack Query cache keys.
- The TanStack Query hooks are split by resource: `reader-queries.ts` (the reader, their settings, reminders and progress), `plan-queries.ts`, `study-queries.ts`, `quiz-queries.ts`, and `generation-queries.ts`. `query-cache-sync.ts` holds the cache and offline-copy updates those writes share; `plan-reset.ts` is the reset flow.
- `client-errors.ts` turns every failure the client meets into one typed `ApiError`.
- `BACKEND_SCHEMA.md` freezes the PostgreSQL ownership model and server invariants before the server workspace exists.

The transport model deliberately does **not** mirror the current mock store one-for-one. Server-owned plan content and per-user progress are separate in the API contract even while the existing local mock store keeps its current normalized shape. This lets the backend be correct without forcing a risky all-at-once UI rewrite.

## Important invariants

- The authenticated session identifies the user. A feature never sends a trusted `userId`.
- Every response is parsed with Zod. No network `as` casts.
- Every logical mutation receives a stable `Idempotency-Key` so a timeout/retry cannot create duplicate plans, attempts, or progress writes.
- Plan list responses are summaries. Full study content is fetched only for the plan/day being used.
- Public Quick Check questions do not contain `correctChoiceId`; the answer key is returned only after an answer is submitted.
- A plan stores a canonical Scripture reference. The study-day response supplies text in the user's current Bible translation.
- Reflection **prompts** may come from the API; reflection **answers** remain local-only and do not belong in these contracts.
- Sermon transcripts remain server-side. Mobile receives sermon metadata and only the quote/clip data used by a plan.

## Backend contract implied by these files

The backend can be implemented as TypeScript + Fastify + Zod + PostgreSQL/Drizzle with a separate generation worker. The mobile package does not need Fastify, Drizzle, or PostgreSQL dependencies; those belong in the server workspace, not this Expo app.
