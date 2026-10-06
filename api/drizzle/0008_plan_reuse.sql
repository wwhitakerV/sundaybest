-- Finds a finished plan for the same sermon, length and Quick Check setting, so
-- its content is copied instead of generated again.
CREATE INDEX plan_generations_reuse_idx ON plan_generations (sermon_id, requested_length, quick_check_enabled, prompt_version)
  WHERE status = 'completed';
