CREATE TYPE user_status AS ENUM ('active','deleted');
CREATE TYPE theme_preference AS ENUM ('system','light','dark');
CREATE TYPE text_size AS ENUM ('small','default','large','extraLarge');
CREATE TYPE bible_translation AS ENUM ('NIV','ESV','KJV','NLT','BSB');
CREATE TYPE reading_paper AS ENUM ('white','ivory','cream','sepia','dusk','night');
CREATE TYPE reminder_kind AS ENUM ('dailyStudy','quickCheck');
CREATE TYPE sermon_platform AS ENUM ('youtube');
CREATE TYPE transcript_status AS ENUM ('available','autoCaptions','processing','unavailable');
CREATE TYPE plan_visibility AS ENUM ('private','sample');
CREATE TYPE enrollment_status AS ENUM ('ready','active','completed','archived');
CREATE TYPE study_step AS ENUM ('read','scripture','reflect','pray');
CREATE TYPE quiz_question_kind AS ENUM ('multipleChoice','finishTheVerse');
CREATE TYPE quiz_question_source AS ENUM ('sermon','scripture');
CREATE TYPE quiz_attempt_status AS ENUM ('inProgress','completed');
CREATE TYPE generation_status AS ENUM ('validating','preparing','processingSermon','findingScripture','writingDays','buildingQuiz','completed','failed');
CREATE TYPE generation_job_status AS ENUM ('queued','running','completed','failed');
CREATE TYPE idempotency_status AS ENUM ('pending','completed');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text,
  onboarded_at timestamptz,
  status user_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE device_installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform text NOT NULL DEFAULT 'ios',
  attestation_key_id text NOT NULL UNIQUE,
  public_key_pem text NOT NULL,
  sign_count integer NOT NULL DEFAULT 0 CHECK (sign_count >= 0),
  app_version text,
  timezone text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX device_installations_user_idx ON device_installations(user_id);

CREATE TABLE refresh_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  installation_id uuid NOT NULL REFERENCES device_installations(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  rotated_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refresh_sessions_installation_idx ON refresh_sessions(installation_id);
CREATE INDEX refresh_sessions_user_idx ON refresh_sessions(user_id);

CREATE TABLE app_attest_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id text,
  challenge_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX app_attest_challenges_key_idx ON app_attest_challenges(key_id);
CREATE INDEX app_attest_challenges_expiry_idx ON app_attest_challenges(expires_at);

CREATE TABLE user_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme theme_preference NOT NULL DEFAULT 'system',
  text_size text_size NOT NULL DEFAULT 'default',
  bible_translation bible_translation NOT NULL DEFAULT 'NIV',
  default_plan_length smallint NOT NULL DEFAULT 6 CHECK (default_plan_length BETWEEN 1 AND 7),
  quick_check_by_default boolean NOT NULL DEFAULT true,
  haptics_enabled boolean NOT NULL DEFAULT true,
  reading_text_offset smallint NOT NULL DEFAULT 0 CHECK (reading_text_offset IN (-4,-2,0,2,4,6,8)),
  reading_paper reading_paper NOT NULL DEFAULT 'white',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sermon_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform sermon_platform NOT NULL DEFAULT 'youtube',
  external_id text NOT NULL,
  canonical_url text NOT NULL,
  title text NOT NULL,
  church_or_channel text,
  thumbnail_url text,
  thumbnail_colors jsonb NOT NULL DEFAULT '[]'::jsonb,
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  published_on date,
  transcript_status transcript_status NOT NULL DEFAULT 'processing',
  transcript_language text,
  metadata_fetched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(platform, external_id)
);

CREATE TABLE sermon_transcript_segments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sermon_id uuid NOT NULL REFERENCES sermon_sources(id) ON DELETE CASCADE,
  sequence integer NOT NULL CHECK (sequence >= 0),
  start_ms integer NOT NULL CHECK (start_ms >= 0),
  end_ms integer CHECK (end_ms IS NULL OR end_ms >= start_ms),
  text text NOT NULL,
  UNIQUE(sermon_id, sequence)
);
CREATE INDEX transcript_sermon_idx ON sermon_transcript_segments(sermon_id);

CREATE TABLE scripture_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book text NOT NULL,
  chapter integer NOT NULL CHECK (chapter > 0),
  verse_start integer NOT NULL CHECK (verse_start > 0),
  verse_end integer NOT NULL CHECK (verse_end >= verse_start),
  canonical_reference text NOT NULL UNIQUE
);

CREATE TABLE scripture_texts (
  reference_id uuid NOT NULL REFERENCES scripture_references(id) ON DELETE CASCADE,
  translation bible_translation NOT NULL,
  verses jsonb NOT NULL,
  provider text NOT NULL,
  provider_version text,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(reference_id, translation)
);

CREATE TABLE plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  sermon_id uuid NOT NULL REFERENCES sermon_sources(id),
  title text NOT NULL,
  visibility plan_visibility NOT NULL DEFAULT 'private',
  length_days smallint NOT NULL CHECK (length_days BETWEEN 1 AND 7),
  quick_check_enabled boolean NOT NULL,
  content_version integer NOT NULL DEFAULT 1 CHECK (content_version > 0),
  ready_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX plans_owner_idx ON plans(owner_user_id);
CREATE INDEX plans_visibility_idx ON plans(visibility);

CREATE TABLE reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind reminder_kind NOT NULL,
  plan_id uuid REFERENCES plans(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  local_time time NOT NULL DEFAULT '08:00:00',
  weekdays text[] NOT NULL DEFAULT ARRAY['sun','mon','tue','wed','thu','fri','sat']::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (cardinality(weekdays) BETWEEN 1 AND 7),
  CHECK (weekdays <@ ARRAY['sun','mon','tue','wed','thu','fri','sat']::text[])
);
CREATE INDEX reminders_user_idx ON reminders(user_id);
CREATE INDEX reminders_plan_idx ON reminders(plan_id);
CREATE UNIQUE INDEX reminders_global_user_kind_uidx ON reminders(user_id, kind) WHERE plan_id IS NULL;
CREATE UNIQUE INDEX reminders_plan_user_kind_uidx ON reminders(user_id, kind, plan_id) WHERE plan_id IS NOT NULL;

CREATE TABLE plan_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_key text NOT NULL,
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  sermon_id uuid REFERENCES sermon_sources(id),
  requested_length smallint NOT NULL CHECK (requested_length BETWEEN 1 AND 7),
  quick_check_enabled boolean NOT NULL,
  status generation_status NOT NULL DEFAULT 'preparing',
  attempt_count integer NOT NULL DEFAULT 1 CHECK (attempt_count > 0),
  generator_version text,
  prompt_version text,
  model_provider text,
  model_name text,
  error_code text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX plan_generations_user_request_uidx ON plan_generations(user_id, request_key);
CREATE INDEX plan_generations_user_idx ON plan_generations(user_id);
CREATE INDEX plan_generations_plan_idx ON plan_generations(plan_id);

CREATE TABLE generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid NOT NULL UNIQUE REFERENCES plan_generations(id) ON DELETE CASCADE,
  status generation_job_status NOT NULL DEFAULT 'queued',
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX generation_jobs_claim_idx ON generation_jobs(status, available_at);

CREATE TABLE plan_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  day_number smallint NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  reading_title text NOT NULL,
  reading_paragraphs jsonb NOT NULL,
  sermon_quote text,
  clip_start_seconds integer CHECK (clip_start_seconds IS NULL OR clip_start_seconds >= 0),
  clip_end_seconds integer CHECK (clip_end_seconds IS NULL OR clip_end_seconds >= clip_start_seconds),
  scripture_reference_id uuid NOT NULL REFERENCES scripture_references(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plan_id, day_number)
);
CREATE INDEX plan_days_plan_idx ON plan_days(plan_id);

CREATE TABLE reflection_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_day_id uuid NOT NULL REFERENCES plan_days(id) ON DELETE CASCADE,
  position smallint NOT NULL CHECK (position > 0),
  question text NOT NULL,
  UNIQUE(plan_day_id, position)
);

CREATE TABLE prayers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_day_id uuid NOT NULL UNIQUE REFERENCES plan_days(id) ON DELETE CASCADE,
  title text NOT NULL,
  text text NOT NULL
);

CREATE TABLE quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  plan_day_id uuid UNIQUE REFERENCES plan_days(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quizzes_plan_idx ON quizzes(plan_id);

CREATE TABLE quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  position smallint NOT NULL CHECK (position > 0),
  kind quiz_question_kind NOT NULL,
  source quiz_question_source NOT NULL,
  prompt text NOT NULL,
  scripture_reference text,
  explanation text,
  UNIQUE(quiz_id, position)
);

CREATE TABLE quiz_choices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  position smallint NOT NULL CHECK (position > 0),
  label text NOT NULL,
  text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  UNIQUE(question_id, position)
);
CREATE UNIQUE INDEX quiz_choices_one_correct_uidx ON quiz_choices(question_id) WHERE is_correct = true;

CREATE TABLE user_plan_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  status enrollment_status NOT NULL DEFAULT 'ready',
  start_date date,
  started_timezone text,
  started_at timestamptz,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, plan_id)
);
CREATE INDEX user_plan_enrollments_user_status_idx ON user_plan_enrollments(user_id, status);

CREATE TABLE plan_day_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES user_plan_enrollments(id) ON DELETE CASCADE,
  plan_day_id uuid NOT NULL REFERENCES plan_days(id) ON DELETE CASCADE,
  scheduled_on date NOT NULL,
  scheduled_timezone text NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  completed_local_date date,
  completed_timezone text,
  UNIQUE(enrollment_id, plan_day_id)
);
CREATE INDEX plan_day_progress_enrollment_idx ON plan_day_progress(enrollment_id);

CREATE TABLE plan_step_progress (
  enrollment_id uuid NOT NULL REFERENCES user_plan_enrollments(id) ON DELETE CASCADE,
  plan_day_id uuid NOT NULL REFERENCES plan_days(id) ON DELETE CASCADE,
  step study_step NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(enrollment_id, plan_day_id, step)
);

CREATE TABLE saved_plans (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  saved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, plan_id)
);

CREATE TABLE quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  status quiz_attempt_status NOT NULL DEFAULT 'inProgress',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX quiz_attempts_user_quiz_idx ON quiz_attempts(user_id, quiz_id);
CREATE UNIQUE INDEX quiz_attempts_one_open_uidx ON quiz_attempts(user_id, quiz_id) WHERE status = 'inProgress';

CREATE TABLE quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  choice_id uuid NOT NULL REFERENCES quiz_choices(id),
  correct boolean NOT NULL,
  answered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

CREATE TABLE idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key text NOT NULL,
  method text NOT NULL,
  path text NOT NULL,
  request_hash text NOT NULL,
  status idempotency_status NOT NULL DEFAULT 'pending',
  response_status integer,
  response_body jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  expires_at timestamptz NOT NULL,
  UNIQUE(user_id, key)
);
CREATE INDEX idempotency_expiry_idx ON idempotency_keys(expires_at);
