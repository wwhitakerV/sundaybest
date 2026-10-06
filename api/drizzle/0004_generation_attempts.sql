-- One row per generation attempt: its outcome, the exact internal reason it
-- failed, and the tokens the model used. Never content.
CREATE TABLE generation_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid NOT NULL REFERENCES plan_generations(id) ON DELETE CASCADE,
  round integer NOT NULL,
  attempt integer NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('completed', 'failed')),
  error text,
  model text,
  finish_reason text,
  prompt_tokens integer,
  completion_tokens integer,
  reasoning_tokens integer,
  duration_ms integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX generation_attempts_generation_idx ON generation_attempts(generation_id);
