# SundayBest backend schema contract

This file is the backend model implied by the mobile `/v1` contracts. It is a
server implementation guide, not a second client-side database model.

## Stack

- TypeScript
- Fastify
- Zod contracts shared/generated from the same shapes as `contracts/*`
- PostgreSQL
- Drizzle ORM + committed forward-only migrations
- Separate generation worker using a PostgreSQL-backed job queue initially
- UTC `timestamptz` for moments; explicit local `date` / IANA timezone when a
  calendar-day rule matters

## Identity and sessions

### `users`

- `id uuid primary key`
- `display_name text null`
- `onboarded_at timestamptz null`
- `status text not null check (status in ('active','deleted'))`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- `deleted_at timestamptz null`

A first attested install receives an anonymous user. Future Sign in with Apple
links that user; it does not replace IDs or duplicate their data.

### `device_installations`

- `id uuid primary key`
- `user_id uuid not null references users(id)`
- `platform text not null`
- `attestation_key_id text not null unique`
- `app_version text null`
- `timezone text null`
- `last_seen_at timestamptz not null`
- `revoked_at timestamptz null`
- `created_at timestamptz not null`

### `refresh_sessions`

- `id uuid primary key`
- `user_id uuid not null references users(id)`
- `installation_id uuid not null references device_installations(id)`
- `refresh_token_hash text not null unique`
- `expires_at timestamptz not null`
- `rotated_at timestamptz null`
- `revoked_at timestamptz null`
- `created_at timestamptz not null`

Access tokens are short lived. Refresh tokens rotate and are stored hashed on
the server. User identity comes from the authenticated session; application
endpoints never trust a client-provided `userId`.

## User settings

### `user_settings`

- `user_id uuid primary key references users(id)`
- `theme text not null`
- `text_size text not null`
- `bible_translation text not null`
- `default_plan_length smallint not null check (default_plan_length between 1 and 7)`
- `quick_check_by_default boolean not null`
- `haptics_enabled boolean not null`
- `reading_text_offset smallint not null`
- `reading_paper text not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### `reminders`

- `id uuid primary key`
- `user_id uuid not null references users(id)`
- `kind text not null`
- `plan_id uuid null`
- `enabled boolean not null`
- `local_time time not null`
- `weekdays text[] not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- unique `(user_id, kind, plan_id)` with null-safe handling

MVP notifications are scheduled locally by iOS. The server syncs preferences so
they survive an account restore; it does not need a push scheduler yet.

## Sermons

### `sermon_sources`

- `id uuid primary key`
- `platform text not null check (platform = 'youtube')` for launch
- `external_id text not null`
- `canonical_url text not null`
- `title text not null`
- `church_or_channel text null`
- `thumbnail_url text null`
- `thumbnail_colors jsonb not null default '[]'`
- `duration_seconds integer null`
- `published_on date null`
- `transcript_status text not null`
- `transcript_language text null`
- `metadata_fetched_at timestamptz null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- unique `(platform, external_id)`

### `sermon_transcript_segments`

- `id bigint generated always as identity primary key`
- `sermon_id uuid not null references sermon_sources(id) on delete cascade`
- `sequence integer not null`
- `start_ms integer not null`
- `end_ms integer null`
- `text text not null`
- unique `(sermon_id, sequence)`

Transcripts stay server-side. Mobile receives only metadata and plan-specific
quotes/clips.

## Plan content versus user state

Plan content is reusable and mostly immutable. Progress belongs to a user's
**enrollment**, never to the shared plan row. This is what allows a sample plan
to be shared by every user without sharing progress.

### `plans`

- `id uuid primary key`
- `owner_user_id uuid null references users(id)`; null for system/sample content
- `sermon_id uuid not null references sermon_sources(id)`
- `generation_id uuid null`
- `title text not null`
- `visibility text not null check (visibility in ('private','sample'))`
- `length_days smallint not null check (length_days between 1 and 7)`
- `quick_check_enabled boolean not null`
- `content_version integer not null default 1`
- `ready_at timestamptz null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### `user_plan_enrollments`

- `id uuid primary key`
- `user_id uuid not null references users(id)`
- `plan_id uuid not null references plans(id)`
- `status text not null check (status in ('ready','active','completed','archived'))`
- `start_date date null`
- `started_timezone text null`
- `started_at timestamptz null`
- `completed_at timestamptz null`
- `archived_at timestamptz null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- unique `(user_id, plan_id)`

Starting a sample creates/enables an enrollment. It never copies or mutates the
shared plan content.

### `plan_days`

- `id uuid primary key`
- `plan_id uuid not null references plans(id) on delete cascade`
- `day_number smallint not null`
- `reading_title text not null`
- `reading_paragraphs jsonb not null` — `{ heading, content }[]`; plans written
  before Read headings keep plain strings, never rewritten, and the API sends
  them as `{ heading: null, content }`
- `sermon_quote text null`
- `clip_start_seconds integer null`
- `clip_end_seconds integer null`
- `scripture_reference_id uuid not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- unique `(plan_id, day_number)`

### `plan_day_progress`

- `id uuid primary key`
- `enrollment_id uuid not null references user_plan_enrollments(id) on delete cascade`
- `plan_day_id uuid not null references plan_days(id)`
- `scheduled_on date not null`
- `scheduled_timezone text not null`
- `started_at timestamptz null`
- `completed_at timestamptz null`
- `completed_local_date date null`
- `completed_timezone text null`
- unique `(enrollment_id, plan_day_id)`

### `plan_step_progress`

- `enrollment_id uuid not null references user_plan_enrollments(id) on delete cascade`
- `plan_day_id uuid not null references plan_days(id)`
- `step text not null check (step in ('read','scripture','reflect','pray'))`
- `completed_at timestamptz not null`
- primary key `(enrollment_id, plan_day_id, step)`

Day N is studyable only when its `scheduled_on` is on/before the user's current
local date **and** every earlier plan day is completed.

## Scripture

### `scripture_references`

- `id uuid primary key`
- `book text not null`
- `chapter integer not null`
- `verse_start integer not null`
- `verse_end integer not null`
- `canonical_reference text not null`

### `scripture_texts`

- `reference_id uuid not null references scripture_references(id)`
- `translation text not null`
- `verses jsonb not null`
- `provider text not null`
- `provider_version text null`
- `fetched_at timestamptz not null`
- primary key `(reference_id, translation)`

Plan content points to the canonical reference, not a translation-specific
passage. A user's translation change therefore takes effect immediately without
regenerating the plan. Server caching must comply with the selected Bible
provider's license.

## Reflection and prayer

### `reflection_prompts`

- `id uuid primary key`
- `plan_day_id uuid not null references plan_days(id) on delete cascade`
- `position smallint not null`
- `question text not null`
- unique `(plan_day_id, position)`

**There is intentionally no `reflection_responses` server table.** Written
reflection answers remain encrypted on the device only.

### `prayers`

- `id uuid primary key`
- `plan_day_id uuid not null references plan_days(id) on delete cascade`
- `title text not null`
- `text text not null`
- unique `(plan_day_id)`

### `prayer_progress`

- `user_id uuid not null references users(id)`
- `prayer_id uuid not null references prayers(id)`
- `prayed_at timestamptz not null`
- primary key `(user_id, prayer_id)`

Prayer is recorded when the Pray step finishes, before Quick Check starts.

## Quick Check

### `quizzes`

- `id uuid primary key`
- `plan_id uuid not null references plans(id)`
- `plan_day_id uuid null references plan_days(id)`
- `title text not null`

### `quiz_questions`

- `id uuid primary key`
- `quiz_id uuid not null references quizzes(id) on delete cascade`
- `position smallint not null`
- `kind text not null`
- `source text not null`
- `prompt text not null`
- `explanation text null`
- `scripture_reference text null`
- `correct_choice_id uuid not null`
- unique `(quiz_id, position)`

### `quiz_choices`

- `id uuid primary key`
- `question_id uuid not null references quiz_questions(id) on delete cascade`
- `label text not null`
- `text text not null`
- `position smallint not null`
- unique `(question_id, position)`

### `quiz_attempts`

- `id uuid primary key`
- `user_id uuid not null references users(id)`
- `quiz_id uuid not null references quizzes(id)`
- `status text not null`
- `started_at timestamptz not null`
- `completed_at timestamptz null`

### `quiz_answers`

- `id uuid primary key`
- `attempt_id uuid not null references quiz_attempts(id) on delete cascade`
- `question_id uuid not null references quiz_questions(id)`
- `choice_id uuid not null references quiz_choices(id)`
- `is_correct boolean not null`
- `answered_at timestamptz not null`
- unique `(attempt_id, question_id)`

Unanswered question payloads never include `correct_choice_id`. The answer
submission response may reveal it with the explanation after the answer is
committed.

For a day with Quick Check enabled, the invariant is:

`Read -> Scripture -> Reflect -> Pray -> Quick Check -> Day complete`.

The API, not only the client, enforces that invariant.

## Saved plans (removed)

Saving a plan is no longer part of the product (October 8, 2026): the app
doesn't read a plan's `saved` field or call `/v1/plans/{id}/saved`. The
server's `saved_plans` table and its endpoints are left for the server's own
cleanup.

## Generation

### `plan_generations`

- `id uuid primary key`
- `user_id uuid not null references users(id)`
- `plan_id uuid not null references plans(id)`
- `sermon_id uuid null references sermon_sources(id)`
- `requested_length smallint not null`
- `quick_check_enabled boolean not null`
- `requested_translation text not null`
- `status text not null`
- `attempt_count integer not null default 1`
- `generator_version text not null`
- `prompt_version text not null`
- `model_provider text not null`
- `model_name text not null`
- `error_code text null`
- `started_at timestamptz null`
- `finished_at timestamptz null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Generation publishes the complete content graph transactionally. A plan does not
become ready while only part of its days/questions exist.

## Idempotency

### `idempotency_keys`

- `user_id uuid not null references users(id)`
- `key text not null`
- `method text not null`
- `path text not null`
- `request_hash text not null`
- `response_status integer null`
- `response_body jsonb null`
- `created_at timestamptz not null`
- `expires_at timestamptz not null`
- primary key `(user_id, key)`

Reusing the same key with a different method/path/request hash returns
`IDEMPOTENCY_CONFLICT`. Replaying the same logical mutation returns the stored
result.

## Account deletion

Account deletion revokes sessions immediately, marks the user deleted, and queues
hard deletion/anonymisation of user-owned rows according to the retention policy.
Shared sermon/sample content is not deleted merely because a user referenced it.
