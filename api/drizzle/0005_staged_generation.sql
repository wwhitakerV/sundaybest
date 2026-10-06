-- Staged generation: the attempt log gains one row per model call (stage "plan",
-- "day 3", "quiz 3"), each accepted or rejected, beside the attempt's "total"
-- row; finish-the-verse questions keep their wording per bundled translation.
ALTER TABLE generation_attempts ADD COLUMN stage text NOT NULL DEFAULT 'total';
ALTER TABLE generation_attempts DROP CONSTRAINT generation_attempts_outcome_check;
ALTER TABLE generation_attempts ADD CONSTRAINT generation_attempts_outcome_check
  CHECK (outcome IN ('completed', 'failed', 'accepted', 'rejected'));
ALTER TABLE quiz_questions ADD COLUMN variants jsonb;
