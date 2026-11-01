-- What a generation repaired or let stand — a point placed, a passage added,
-- a quote put back in the sermon's words — for the development review. Never
-- shown to readers. Empty for generations before notes were kept.
ALTER TABLE plan_generations ADD COLUMN notes jsonb NOT NULL DEFAULT '[]'::jsonb;
