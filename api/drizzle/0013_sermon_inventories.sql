-- What the plan step found in a sermon whatever the plan's length — its
-- title, speaker, points and About this plan — so its other lengths only
-- divide the points into days. One per sermon and prompt: a new prompt finds
-- them fresh. Sermon content only, never anything about a reader.
CREATE TABLE sermon_inventories (
  sermon_id uuid NOT NULL REFERENCES sermon_sources(id) ON DELETE CASCADE,
  generator_version text NOT NULL,
  prompt_version text NOT NULL,
  point_count integer NOT NULL,
  inventory jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (sermon_id, generator_version, prompt_version)
);
