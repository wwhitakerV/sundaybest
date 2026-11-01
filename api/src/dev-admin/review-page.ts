/**
 * One plan, read whole (`GET /dev/admin/review?plan=…`, development only): the
 * sermon's points, then each day — its Read, Scripture, reflections and prayer
 * beside its six faculties — so the Reader and Interactive content can be
 * judged side by side. Plain HTML, its styles and script inline, talking to
 * `/dev/admin/plans/:id/review`. Every value is set as text, never as markup.
 */
export const REVIEW_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Plan review · SundayBest</title>
<style>
  :root { --red: #D62626; --ink: #111114; --muted: #6b6b73; --line: #e6e6ea; --soft: #f6f6f8; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; color: var(--ink); font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif; }
  main { max-width: 1180px; margin: 0 auto; padding: 32px 24px 96px; }
  a { color: var(--ink); }
  h1 { font-size: 26px; margin: 8px 0 4px; }
  h2 { font-size: 20px; margin: 0; }
  h3 { font: 600 12px/1 -apple-system, sans-serif; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin: 0 0 14px; }
  .meta, .muted { color: var(--muted); font-size: 13px; }
  .tag { display: inline-block; font: 600 11px/1 -apple-system, sans-serif; letter-spacing: 0.06em; text-transform: uppercase; background: var(--soft); border-radius: 6px; padding: 4px 6px; margin-right: 6px; color: var(--muted); }
  .points li { margin: 0 0 12px; list-style: none; }
  .points { padding: 0; margin: 16px 0 0; }
  .day { border-top: 1px solid var(--line); margin-top: 40px; padding-top: 24px; }
  .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 20px; }
  .section { margin: 0 0 18px; }
  .section h4 { margin: 0 0 4px; font-size: 15px; }
  .section p { margin: 0; white-space: pre-wrap; }
  .notes { margin: 8px 0 24px; padding: 12px 16px 12px 32px; background: #fff7e6; border-radius: 12px; font-size: 13px; }
  .notes li { margin: 4px 0; }
  .faculty { background: var(--soft); border-radius: 14px; padding: 14px 16px; margin: 0 0 12px; }
  .faculty .name { font: 700 12px/1 -apple-system, sans-serif; letter-spacing: 0.14em; color: var(--red); }
  .faculty .question { font-weight: 600; margin: 6px 0; }
  .faculty .answer { margin: 6px 0 2px; }
  .faculty .frame { color: var(--muted); font-size: 13px; margin: 4px 0; }
  .faculty .commit { margin-top: 8px; }
  .faculty .commit::before { content: "→ "; color: var(--red); }
  @media (max-width: 820px) { .columns { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<main>
  <a class="meta" href="/dev/admin">← Our plans</a>
  <div id="plan"><p class="muted">Loading…</p></div>
</main>
<script>
  const root = document.getElementById("plan");
  const el = (tag, className, text) => Object.assign(document.createElement(tag), className ? { className } : {}, text != null ? { textContent: text } : {});
  const time = (seconds) => seconds == null ? null : Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
  // The video at a moment: the review checks the sermon by hearing it, never by reading captions.
  let video = null;
  const at = (seconds, label) => {
    if (seconds == null || !video) return el("span", "meta", "no time");
    const link = new URL(video);
    link.searchParams.set("t", seconds + "s");
    return Object.assign(el("a", "meta", label ?? time(seconds) + " ▶"), { href: link.href, target: "_blank", rel: "noopener" });
  };

  function point(item) {
    const row = el("li");
    row.append(el("span", "tag", item.id + " · " + item.kind), document.createTextNode(item.statement + " "), at(item.startSeconds));
    return row;
  }

  function reader(day) {
    const column = el("div");
    column.append(el("h3", null, "Reader"));
    if (day.focus) column.append(el("p", "muted", day.focus));
    for (const paragraph of day.readingParagraphs) {
      const section = el("div", "section");
      if (paragraph.heading) section.append(el("h4", null, paragraph.heading));
      section.append(el("p", null, paragraph.content));
      if (paragraph.pointIds.length) section.append(el("div", "meta", "Covers " + paragraph.pointIds.join(", ")));
      column.append(section);
    }
    column.append(el("h4", null, "Reflect"));
    for (const question of day.reflections) column.append(el("p", null, question));
    if (day.prayer) column.append(el("h4", null, "Pray · " + day.prayer.title), el("p", null, day.prayer.text));
    return column;
  }

  function interactive(day) {
    const column = el("div");
    column.append(el("h3", null, "Interactive"));
    if (!day.faculties.length) column.append(el("p", "muted", "Written before the faculties."));
    for (const entry of day.faculties) {
      const card = el("div", "faculty");
      card.append(el("div", "name", entry.faculty.toUpperCase()));
      if (entry.transition) card.append(el("div", "frame", entry.transition));
      card.append(el("div", "question", entry.question));
      card.append(el("p", "answer", entry.answer), el("div", "meta", entry.pointId));
      if (entry.reflection) card.append(el("div", "frame", entry.reflection));
      card.append(el("div", "commit", entry.commitment));
      column.append(card);
    }
    if (day.ending.length) {
      column.append(el("h4", null, "Also in this part of the sermon"));
      for (const item of day.ending) column.append(el("p", null, item.statement), el("div", "meta", item.pointId));
    }
    return column;
  }

  function render({ plan, notes, days }) {
    video = plan.url;
    document.title = plan.title + " · Plan review";
    const head = el("div");
    head.append(el("h1", null, plan.title), el("div", "meta", plan.speakerName ? "Speaker: " + plan.speakerName : "No speaker named"));
    const points = el("ul", "points");
    for (const item of plan.points) points.append(point(item));
    if (notes.length) {
      const list = el("ul", "notes");
      for (const note of notes) list.append(el("li", null, note));
      head.append(el("h3", null, notes.length + (notes.length === 1 ? " repair" : " repairs") + " made while generating"), list);
    }
    head.append(el("h3", null, plan.points.length + " points in the sermon"), points);
    const sections = days.map((day) => {
      const block = el("section", "day");
      block.append(el("h2", null, "Day " + day.dayNumber + " · " + day.readingTitle));
      block.append(el("div", "meta", [day.passage, ...day.alsoReferenced].join(" · ")));
      block.append(day.clip ? at(day.clip.startSeconds, "Its part of the sermon: " + time(day.clip.startSeconds) + "–" + time(day.clip.endSeconds) + " ▶") : el("div", "meta", "No clip"));
      const carried = el("div");
      for (const item of day.points) carried.append(el("span", "tag", item.id));
      const columns = el("div", "columns");
      columns.append(reader(day), interactive(day));
      block.append(carried, columns);
      return block;
    });
    root.replaceChildren(head, ...sections);
  }

  const id = new URLSearchParams(location.search).get("plan");
  if (!id) root.replaceChildren(el("p", "muted", "No plan chosen."));
  else fetch("/dev/admin/plans/" + encodeURIComponent(id) + "/review")
    .then((response) => response.ok ? response.json() : Promise.reject(new Error("Couldn't load that plan (" + response.status + ")")))
    .then(render)
    .catch((error) => root.replaceChildren(el("p", "muted", error.message)));
</script>
</body>
</html>`;
