-- The day's focus (its thesis), kept so a reused plan's quizzes can be written later.
ALTER TABLE plan_days ADD COLUMN focus text;
-- Each accepted step's model output, kept until its plan is published, so a
-- retried or reclaimed generation resumes instead of starting over.
CREATE TABLE generation_steps (
  generation_id uuid NOT NULL REFERENCES plan_generations(id) ON DELETE CASCADE,
  step text NOT NULL,
  output jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (generation_id, step)
);
-- A step taken from an earlier run is logged as resumed.
ALTER TABLE generation_attempts DROP CONSTRAINT generation_attempts_outcome_check;
ALTER TABLE generation_attempts ADD CONSTRAINT generation_attempts_outcome_check
  CHECK (outcome IN ('completed', 'failed', 'accepted', 'rejected', 'resumed'));
