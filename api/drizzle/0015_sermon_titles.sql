-- A sermon's own title, found in its video's title by the title step, with
-- the series and part it's from: the video title's own words, in Title Case
-- (ADR 0043). Null until titled, and again whenever the video is retitled on
-- YouTube; `titled_version` is the title step's version that found them.
ALTER TABLE sermon_sources ADD COLUMN display_title text;
ALTER TABLE sermon_sources ADD COLUMN series text;
ALTER TABLE sermon_sources ADD COLUMN series_part text;
ALTER TABLE sermon_sources ADD COLUMN titled_version text;
