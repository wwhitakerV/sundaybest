-- How much of each call's input OpenAI billed at its cached rate, so the
-- attempt log shows whether a plan's calls are reusing the transcript.
ALTER TABLE generation_attempts ADD COLUMN cached_prompt_tokens integer;
