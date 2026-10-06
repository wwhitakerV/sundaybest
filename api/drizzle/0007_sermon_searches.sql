-- Recent sermon searches: which videos Supadata returned for a search term, so
-- the same term within a day is answered from the catalog. No user is recorded.
CREATE TABLE sermon_searches (
  query text PRIMARY KEY,
  external_ids jsonb NOT NULL,
  searched_at timestamptz NOT NULL DEFAULT now()
);
