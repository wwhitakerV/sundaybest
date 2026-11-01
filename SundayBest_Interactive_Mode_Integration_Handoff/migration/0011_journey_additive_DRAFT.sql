-- ADDITIVE schema proposal for Archive(5).zip; review and test before applying.
-- Existing Reader columns, rows and endpoints remain unchanged.
ALTER TABLE plans ADD COLUMN IF NOT EXISTS formation jsonb;
ALTER TABLE plan_days ADD COLUMN IF NOT EXISTS journey jsonb;

CREATE TABLE IF NOT EXISTS journey_commitment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_day_id uuid NOT NULL REFERENCES plan_days(id) ON DELETE CASCADE,
  node_id text NOT NULL,
  commitment_id text NOT NULL,
  status text NOT NULL DEFAULT 'committed' CHECK
    (status IN ('committed','followedThrough','attempted','notYet','noOpportunity')),
  chosen_at timestamptz NOT NULL DEFAULT now(),
  checked_in_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, plan_day_id, node_id)
);
CREATE INDEX IF NOT EXISTS journey_commitment_user_day_idx
  ON journey_commitment_events (user_id, plan_day_id);
-- IMPORTANT: mirror these definitions in src/db/schema.ts before Drizzle queries use them.
-- No completion-step data is added or altered by this migration.
