-- Supporting Scripture ("Dive deeper"): passages SundayBest chose to support a
-- day's teaching, kept apart from the Scripture the sermon itself names.
ALTER TABLE plan_days ADD COLUMN supporting_scriptures jsonb NOT NULL DEFAULT '[]'::jsonb;
