-- Readers never see the sermon quoted (ADR 0042): days no longer keep a
-- quote of it. Each day's part of the sermon is its clip, into the video.
ALTER TABLE plan_days DROP COLUMN sermon_quote;
