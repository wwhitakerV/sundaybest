-- How far along a build is, 0-100, for the app's progress bar.
ALTER TABLE plan_generations ADD COLUMN progress smallint NOT NULL DEFAULT 0;
UPDATE plan_generations SET progress = 100 WHERE status = 'completed';
-- When the reader dismissed the build from the app's generation bar; until
-- then a build is listed as current, finished or not.
ALTER TABLE plan_generations ADD COLUMN dismissed_at timestamptz;
-- Builds from before the bar existed were already seen on the old screens.
UPDATE plan_generations SET dismissed_at = now();
CREATE INDEX plan_generations_current_idx ON plan_generations (user_id, created_at) WHERE dismissed_at IS NULL;
