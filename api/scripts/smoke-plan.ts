import "dotenv/config";
import { parseArgs } from "node:util";
import { setTimeout as wait } from "node:timers/promises";
import { createPlanResponseSchema, getPlanGenerationResponseSchema, getPlanResponseSchema, getStudyDayResponseSchema,
  resolveSermonResponseSchema, sessionCredentialsSchema } from "../src/contracts/index.js";

const args = parseArgs({ allowPositionals: true, options: {
  api: { type: 'string', default: 'http://localhost:4100' },
  days: { type: 'string', default: '1' },
  quiz: { type: 'string', default: 'on' },
  study: { type: 'boolean', default: false },
} });

async function main() {
  const url = args.positionals[0];
  const days = Number(args.values.days);
  if (!url || !Number.isInteger(days) || days < 1 || days > 7 || !['on', 'off'].includes(args.values.quiz!)) {
    throw new Error('Usage: npm run smoke:plan -- YOUTUBE_URL --days 1 --quiz on [--study] [--api http://localhost:4100]');
  }
  const base = args.values.api!.replace(/\/$/, '');
  let token = process.env.SMOKE_ACCESS_TOKEN;
  async function request(path: string, method = 'GET', payload?: unknown): Promise<unknown> {
    const response = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json',
      'X-Client-Timezone': 'UTC', ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(method !== 'GET' ? { 'Idempotency-Key': crypto.randomUUID() } : {}) },
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }), signal: AbortSignal.timeout(45_000) });
    const body: unknown = await response.json();
    if (!response.ok) {
      const code = typeof body === 'object' && body !== null && 'error' in body ? (body as { error?: { code?: string } }).error?.code : 'unknown';
      throw new Error(`${method} ${path} failed: HTTP ${response.status}, ${code ?? 'unknown'}`);
    }
    return body;
  }
  if (!token) token = sessionCredentialsSchema.parse(await request('/v1/dev/session', 'POST', { installationId: 'sundaybest-pipeline-smoke', timezone: 'UTC' })).accessToken;
  const { sermon } = resolveSermonResponseSchema.parse(await request('/v1/sermons/resolve', 'POST', { url }));
  const created = createPlanResponseSchema.parse(await request('/v1/plans', 'POST', { sermonId: sermon.id, lengthDays: days, quickCheckEnabled: args.values.quiz === 'on' }));
  console.log(`Generation ${created.generationId}; plan ${created.planId}`);
  const deadline = Date.now() + 600_000;
  let lastStatus = '';
  while (Date.now() < deadline) {
    const { generation } = getPlanGenerationResponseSchema.parse(await request(`/v1/plan-generations/${created.generationId}`));
    if (generation.status !== lastStatus) { console.log(generation.status); lastStatus = generation.status; }
    if (generation.status === 'failed') throw new Error(`Generation failed (${generation.error?.code ?? 'unknown'}): ${generation.error?.message ?? ''}`);
    if (generation.status === 'completed') {
      const { plan } = getPlanResponseSchema.parse(await request(`/v1/plans/${created.planId}`));
      console.log(`Validated ${plan.days.length} days; ${plan.days.filter((d) => d.quickCheckId !== null).length} Quick Checks.`);
      if (args.values.study) {
        await request(`/v1/plans/${created.planId}/start`, 'POST', {});
        const { day } = getStudyDayResponseSchema.parse(await request(`/v1/plans/${created.planId}/days/1`));
        console.log(`Study day 1 validated in ${day.scripture.translation}; ${day.scripture.verses.length} verses.`);
      }
      return;
    }
    await wait(2_000);
  }
  throw new Error('Generation is still running after 10 minutes. Inspect the API/worker and poll the printed generation ID.');
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : 'Smoke check failed'); process.exitCode = 1; });
