-- Who preached, as the sermon or its video names them, for attributing their
-- words; null when neither does, and for plans written before it was kept.
ALTER TABLE plans ADD COLUMN speaker_name text;
-- Every point the sermon makes, inventoried by the plan step; null for plans
-- written before the inventory.
ALTER TABLE plans ADD COLUMN formation jsonb;
-- A day's share of the whole sermon — its points, the other passages its part
-- names, which points its Read covers — and its six faculties; null for days
-- written before them. Parsed on read.
ALTER TABLE plan_days ADD COLUMN journey jsonb;
