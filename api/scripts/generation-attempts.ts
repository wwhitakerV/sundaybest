import "dotenv/config";

import postgres from "postgres";

import { env } from "../src/config/env.js";

// Prints the attempt log for one generation, or for the latest ten. Outcomes,
// reasons, and token counts only; never plan content or transcripts.
const generationId = process.argv[2];
const sql = postgres(env.DATABASE_URL, { max: 1 });

try {
  const rows = await sql`
    select a.generation_id, g.requested_length as days, g.quick_check_enabled as quiz, a.stage, a.round, a.attempt,
      a.outcome, a.finish_reason, a.prompt_tokens, a.cached_prompt_tokens, a.completion_tokens, a.reasoning_tokens,
      round(a.duration_ms / 1000.0) as seconds, a.error, a.created_at
    from generation_attempts a join plan_generations g on g.id = a.generation_id
    where ${generationId ? sql`a.generation_id = ${generationId}` : sql`a.generation_id in (
      select generation_id from generation_attempts group by generation_id order by max(created_at) desc limit 10)`}
    order by a.created_at`;
  for (const row of rows) {
    const tokens = `in ${row.prompt_tokens ?? "?"} (cached ${row.cached_prompt_tokens ?? "?"}) · out ${row.completion_tokens ?? "?"} · reasoning ${row.reasoning_tokens ?? "?"}`;
    // A whole attempt, a reused plan, or a step taken from an earlier run made no call of its own.
    const ending = row.stage === "total" || row.stage === "reused" || row.outcome === "resumed" ? "" : ` (${row.finish_reason ?? "no response"})`;
    process.stdout.write(`${String(row.generation_id).slice(0, 8)} ${row.days}d quiz:${row.quiz ? "on" : "off"} round ${row.round} attempt ${row.attempt} ` +
      `${String(row.stage).padEnd(6)} ${row.outcome}${ending} ${row.seconds}s | ${tokens}${row.error ? ` | ${row.error}` : ""}\n`);
  }
  if (rows.length === 0) process.stdout.write("No attempts recorded.\n");
} finally {
  await sql.end({ timeout: 5 });
}
