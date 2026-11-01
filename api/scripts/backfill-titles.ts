import "dotenv/config";

import { writeFile } from "node:fs/promises";

import postgres from "postgres";

import { env } from "../src/config/env.js";
import { TITLE_VERSION } from "../src/generation/prompts/version.js";
import type { SermonTitle } from "../src/generation/title/map-title.js";
import { createPlanGenerationProvider } from "../src/providers/plan-generation-provider.js";

// Finds the sermon's own title for sermons not yet titled by this title step,
// sermons with plans first, then the most recent. A dry run unless --write:
// it prints what it found and stores nothing. With --write it stores each
// title, series and part, and retitles that sermon's plans — the video's own
// title where none was found. --limit N (50) caps how many; --out FILE also
// writes the results as a page to read. Video titles only, never plan content.
const args = process.argv.slice(2);
const option = (name: string) => {
  const at = args.indexOf(name);
  return at === -1 ? undefined : args[at + 1];
};
const write = args.includes("--write");
const limit = Number(option("--limit") ?? 50);
const out = option("--out");
/** Titles asked for at once: small calls, kept few so OpenAI isn't flooded. */
const AT_ONCE = 5;

const generator = createPlanGenerationProvider(env);
if (!generator.findTitle) throw new Error("Set OPENAI_API_KEY: only the OpenAI provider finds titles");
const findTitle = generator.findTitle.bind(generator);
const sql = postgres(env.DATABASE_URL, { max: 1 });

type Found = { raw: string; found: SermonTitle | null };

try {
  const sermons = await sql<{ id: string; title: string; church: string | null }[]>`
    select s.id, s.title, s.church_or_channel as church
    from sermon_sources s
    where s.titled_version is distinct from ${TITLE_VERSION}
    order by exists (select 1 from plans p where p.sermon_id = s.id) desc, s.updated_at desc
    limit ${limit}`;
  const results: Found[] = [];
  for (let start = 0; start < sermons.length; start += AT_ONCE) {
    const batch = sermons.slice(start, start + AT_ONCE);
    const found = await Promise.all(batch.map((sermon) => findTitle({ title: sermon.title, church: sermon.church })));
    for (const [index, sermon] of batch.entries()) {
      const title = found[index] ?? null;
      results.push({ raw: sermon.title, found: title });
      process.stdout.write(`${sermon.title}\n  → ${title ? [title.title, title.series, title.part].map((part) => part ?? "—").join(" | ") : "(not found: the video's title stays)"}\n`);
      if (!write) continue;
      await sql.begin(async (tx) => {
        if (title) {
          await tx`update sermon_sources set display_title = ${title.title}, series = ${title.series}, series_part = ${title.part},
            titled_version = ${TITLE_VERSION}, updated_at = now() where id = ${sermon.id} and title = ${sermon.title}`;
        }
        // Only while the video still has the title this was found in.
        await tx`update plans set title = ${title?.title ?? sermon.title}, updated_at = now() where sermon_id = ${sermon.id}
          and exists (select 1 from sermon_sources s where s.id = ${sermon.id} and s.title = ${sermon.title})`;
      });
    }
  }
  const missed = results.filter((result) => !result.found).length;
  process.stdout.write(`\n${results.length} sermons, ${results.length - missed} titled, ${missed} left with the video's title. ${write ? "Stored." : "Dry run: nothing stored."}\n`);
  if (out) await writeFile(out, page(results));
} finally {
  await sql.end({ timeout: 5 });
}

function page(results: readonly Found[]): string {
  const escape = (text: string | null) => (text ?? "—").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const rows = results.map(({ raw, found }) =>
    `<tr><td>${escape(raw)}</td><td><b>${escape(found?.title ?? null)}</b></td><td>${escape(found?.series ?? null)}</td><td>${escape(found?.part ?? null)}</td></tr>`).join("\n");
  return `<!doctype html><meta charset="utf-8"><title>Sermon titles</title>
<style>body{font:15px -apple-system,sans-serif;margin:24px;color:#111}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left;vertical-align:top}th{font-size:12px;text-transform:uppercase;color:#666}</style>
<h1>Sermon titles</h1><table><tr><th>Video title</th><th>Title</th><th>Series</th><th>Part</th></tr>
${rows}</table>`;
}
