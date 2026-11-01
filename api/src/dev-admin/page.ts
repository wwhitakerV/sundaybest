/**
 * The page that manages our plans (`GET /dev/admin`, development only): one
 * plain HTML document, its styles and script inline, talking to
 * `/dev/admin/samples` on the same server — and listing recent plans, each
 * opening its review (`/dev/admin/review`).
 */
export const DEV_ADMIN_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Our plans · SundayBest</title>
<style>
  :root { --red: #D62626; --ink: #111114; --muted: #6b6b73; --line: #e6e6ea; --paper: #ffffff; --soft: #f6f6f8; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--paper); color: var(--ink); font: 15px/1.45 -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 40px 24px 80px; }
  header { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 32px; }
  h1 { margin: 0; font: 600 13px/1 -apple-system, sans-serif; letter-spacing: 0.14em; text-transform: uppercase; }
  h1 span { display: inline-block; background: var(--red); color: #fff; padding: 6px 10px 5px; }
  header p { margin: 0; color: var(--muted); font-size: 13px; }
  h2 { font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin: 40px 0 12px; }
  form { display: grid; grid-template-columns: 1fr auto auto auto; gap: 10px; align-items: center; padding: 16px; background: var(--soft); border-radius: 16px; }
  input[type=url], select { font: inherit; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; background: #fff; min-width: 0; }
  label.check { display: flex; align-items: center; gap: 6px; font-size: 14px; white-space: nowrap; }
  button { font: 600 14px/1 -apple-system, sans-serif; border: 0; border-radius: 999px; padding: 11px 18px; cursor: pointer; background: var(--ink); color: #fff; }
  button:disabled { opacity: 0.5; cursor: default; }
  button.remove { background: transparent; color: var(--red); padding: 8px 4px; }
  .message { min-height: 20px; margin: 10px 2px 0; font-size: 14px; color: var(--muted); }
  .message.error { color: var(--red); }
  ul { list-style: none; margin: 0; padding: 0; }
  li { display: grid; grid-template-columns: 96px 1fr auto; gap: 16px; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--line); }
  li img, li .blank { width: 96px; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 8px; background: var(--soft); display: block; }
  .title { font-weight: 600; }
  .meta { color: var(--muted); font-size: 13px; }
  .state { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
  .state.ready { color: #1f7a3d; }
  .state.generating { color: var(--muted); }
  .state.failed { color: var(--red); }
  .empty { color: var(--muted); padding: 20px 0; }
  #recent li { grid-template-columns: 1fr auto; }
  a.review { font-weight: 600; font-size: 14px; color: var(--ink); }
  a.video { font-size: 13px; color: var(--red); }
  @media (max-width: 640px) { form { grid-template-columns: 1fr 1fr; } form input[type=url] { grid-column: 1 / -1; } }
</style>
</head>
<body>
<main>
  <header>
    <h1><span>SundayBest</span>&nbsp; Our plans</h1>
    <p>What "Try one of ours" offers · development only</p>
  </header>

  <h2>Add one of ours</h2>
  <form id="add">
    <input id="url" type="url" required placeholder="A YouTube sermon link" aria-label="YouTube sermon link">
    <select id="days" aria-label="Days">
      ${[1, 2, 3, 4, 5, 6, 7].map((days) => `<option value="${days}"${days === 5 ? " selected" : ""}>${days} ${days === 1 ? "day" : "days"}</option>`).join("")}
    </select>
    <label class="check"><input id="quiz" type="checkbox" checked> Quick Check</label>
    <button id="submit" type="submit">Add</button>
  </form>
  <p id="message" class="message"></p>

  <h2>Ours</h2>
  <ul id="list"><li class="empty">Loading…</li></ul>

  <h2>Recent plans · review</h2>
  <ul id="recent"><li class="empty">Loading…</li></ul>
</main>
<script>
  const list = document.getElementById("list");
  const message = document.getElementById("message");
  const submit = document.getElementById("submit");
  let timer = null;

  const say = (text, error = false) => { message.textContent = text; message.className = "message" + (error ? " error" : ""); };
  const describe = (sample) => sample.state === "ready" ? "Ready" : sample.state === "failed" ? "Failed" + (sample.detail ? " · " + sample.detail : "") : "Generating" + (sample.detail ? " · " + sample.detail : "");

  async function request(method, path, body) {
    const response = await fetch(path, { method, headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || "Something went wrong (" + response.status + ")");
    return data;
  }

  function row(sample) {
    const item = document.createElement("li");
    const art = sample.thumbnailUrl ? Object.assign(document.createElement("img"), { src: sample.thumbnailUrl, alt: "" }) : Object.assign(document.createElement("div"), { className: "blank" });
    const words = document.createElement("div");
    const title = Object.assign(document.createElement("div"), { className: "title", textContent: sample.title });
    const meta = Object.assign(document.createElement("div"), { className: "meta", textContent: [sample.church, sample.lengthDays + (sample.lengthDays === 1 ? " day" : " days")].filter(Boolean).join(" · ") });
    const state = Object.assign(document.createElement("div"), { className: "state " + sample.state, textContent: describe(sample) });
    words.append(title, meta, videoLink(sample.url), state);
    if (sample.state === "ready") words.append(reviewLink(sample.id));
    const remove = Object.assign(document.createElement("button"), { className: "remove", textContent: "Remove", type: "button" });
    remove.addEventListener("click", async () => {
      if (!confirm("Take \\u201c" + sample.title + "\\u201d out of \\u201cTry one of ours\\u201d? Anyone already studying it keeps it.")) return;
      remove.disabled = true;
      try { await request("DELETE", "/dev/admin/samples/" + sample.id); say("Removed."); await load(); }
      catch (error) { say(error.message, true); remove.disabled = false; }
    });
    item.append(art, words, remove);
    return item;
  }

  /** The sermon on YouTube, in a new tab. */
  function videoLink(url) {
    return Object.assign(document.createElement("a"), { className: "video", href: url, target: "_blank", rel: "noopener", textContent: url });
  }

  function reviewLink(planId) {
    return Object.assign(document.createElement("a"), { className: "review", href: "/dev/admin/review?plan=" + planId, textContent: "Review" });
  }

  async function loadRecent() {
    try {
      const { plans } = await request("GET", "/dev/admin/plans");
      const recent = document.getElementById("recent");
      recent.replaceChildren(...(plans.length ? plans.map((plan) => {
        const item = document.createElement("li");
        const words = document.createElement("div");
        words.append(
          Object.assign(document.createElement("div"), { className: "title", textContent: plan.title }),
          Object.assign(document.createElement("div"), { className: "meta", textContent: [plan.church, plan.lengthDays + (plan.lengthDays === 1 ? " day" : " days"), plan.state].filter(Boolean).join(" · ") }),
          videoLink(plan.url),
        );
        item.append(words, plan.state === "ready" ? reviewLink(plan.id) : document.createElement("span"));
        return item;
      }) : [Object.assign(document.createElement("li"), { className: "empty", textContent: "No plans yet." })]));
    } catch (error) { say(error.message, true); }
  }

  async function load() {
    clearTimeout(timer);
    try {
      const { samples } = await request("GET", "/dev/admin/samples");
      list.replaceChildren(...(samples.length ? samples.map(row) : [Object.assign(document.createElement("li"), { className: "empty", textContent: "None yet. Add a sermon above." })]));
      // Keep watching while anything is still being written.
      if (samples.some((sample) => sample.state === "generating")) timer = setTimeout(load, 4000);
    } catch (error) { say(error.message, true); }
  }

  document.getElementById("add").addEventListener("submit", async (event) => {
    event.preventDefault();
    submit.disabled = true;
    say("Finding the sermon and starting its plan…");
    try {
      await request("POST", "/dev/admin/samples", {
        url: document.getElementById("url").value.trim(),
        lengthDays: Number(document.getElementById("days").value),
        quickCheckEnabled: document.getElementById("quiz").checked,
      });
      document.getElementById("url").value = "";
      say("Started. It appears in the app once it's ready — the worker (npm run dev:worker) must be running.");
      await load();
    } catch (error) { say(error.message, true); }
    finally { submit.disabled = false; }
  });

  load();
  loadRecent();
</script>
</body>
</html>`;
