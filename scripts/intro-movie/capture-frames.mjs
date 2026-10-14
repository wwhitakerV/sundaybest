#!/usr/bin/env node
// Captures a launch intro film, frame by frame, from its prototype with the
// app's own settings for it, at a phone's resolution and 120 frames a second:
//
//   pool    the pool intro in water (launch-intro-pool-v6.html, POOL_MOVIE_SETTINGS)
//   water   the water intro (launch-intro-pool-v4.html, WATER_SETTINGS)
//
//   node scripts/intro-movie/capture-frames.mjs <frames dir> [fps] [film]
//
// Writes <frames dir>/00000.png… and <frames dir>/movie.json: the size, the
// frame rate, the settings it was captured with, its beats, and the moment the
// first letter lands (for its haptic). The prototype
// draws any moment from the time alone, so each frame is that moment, exactly.
//
// Drives Chrome over its own debugging protocol (Node's built-in WebSocket),
// so it needs no browser library: only Google Chrome, installed as usual. It
// works on a copy of the prototype in the frames folder; the prototype is
// never changed.

import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { POOL_MOVIE_SETTINGS } from "../../src/features/launch-intro/logic/movie/pool-movie-settings.ts";
import { WATER_SETTINGS } from "../../src/features/launch-intro/logic/water/settings.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
/**
 * Each film's prototype and settings. The pool film ends by fading, which the
 * app does over the page itself: the prototype's own fade is left out of it.
 */
const FILMS = {
  pool: { prototype: "launch-intro-pool-v6.html", settings: POOL_MOVIE_SETTINGS, ownFade: true },
  water: { prototype: "launch-intro-pool-v4.html", settings: WATER_SETTINGS, ownFade: false },
};
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333;

/** The prototype's stage, in its own points, and the phone it's captured for. */
const STAGE = { width: 390, height: 844 };
/** The largest iPhone, 440pt wide at 3×: smaller ones scale it down. */
const VIEW = { width: 440, height: Math.round((440 * STAGE.height) / STAGE.width), scale: 3 };

const [framesDir, fpsArg, filmArg = "pool"] = process.argv.slice(2);
const film = FILMS[filmArg];
if (!framesDir || !film) {
  console.error(
    "Usage: node scripts/intro-movie/capture-frames.mjs <frames dir> [fps] [pool|water]",
  );
  process.exit(1);
}
const PROTOTYPE = join(ROOT, "docs/prototypes", film.prototype);
const SETTINGS = film.settings;
const FPS = Number(fpsArg ?? 120);
mkdirSync(framesDir, { recursive: true });

/** The prototype, showing only its stage, edge to edge, with a hook to drive it. */
function stageOnlyCopy() {
  let html = readFileSync(PROTOTYPE, "utf8");
  const swap = (from, to) => {
    if (!html.includes(from)) throw new Error(`The prototype has changed: "${from}" not found`);
    html = html.replace(from, to);
  };
  swap(
    "</style>",
    `  body { margin: 0 !important; background: #fff !important; overflow: hidden !important; }
  header, .panel { display: none !important; }
  #stage { position: fixed !important; left: 0 !important; top: 0 !important; width: 100vw !important;
    height: 100vh !important; border-radius: 0 !important; z-index: 2147483647 !important; }
</style>`,
  );
  // It plays from the start on its own after a moment; the capture moves it instead.
  swap("    if (!reduce)\n", "    if (false)\n");
  // The app fades the film over the page itself, so the film holds the full screen of water.
  if (film.ownFade) swap('$("stage").style.opacity = (1 - fade).toFixed(3);', "");
  swap(
    "    seek(total);\n",
    `    seek(0);
    document.getElementById("stage").setAttribute("preserveAspectRatio", "none");
    window.__intro = {
      setParams(next) { params = { ...params, ...next }; buildTimeline(); seek(0); },
      params: () => ({ ...params }),
      beats: () => Object.fromEntries(beatList.map((b) => [b.key, { start: b.start, end: b.end }])),
      total: () => total,
      firstHit: () => Math.min(...world.falls.map((f) => f.hit)),
      seek,
    };
`,
  );
  const copy = join(framesDir, "prototype.html");
  writeFileSync(copy, html);
  return pathToFileURL(copy).href;
}

/** A Chrome devtools session: send a command, get its result. */
async function connect() {
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = list.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((ok, fail) => {
    ws.onopen = ok;
    ws.onerror = fail;
  });
  let id = 0;
  const waiting = new Map();
  const events = [];
  ws.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && waiting.has(message.id)) {
      const { ok, fail } = waiting.get(message.id);
      waiting.delete(message.id);
      if (message.error) fail(new Error(message.error.message));
      else ok(message.result);
    } else if (message.method) events.push(message.method);
  };
  const send = (method, params = {}) =>
    new Promise((ok, fail) => {
      id += 1;
      waiting.set(id, { ok, fail });
      ws.send(JSON.stringify({ id, method, params }));
    });
  return { send, events, close: () => ws.close() };
}

/** Runs `expression` in the page and returns its value. */
async function evaluate(session, expression) {
  const { result, exceptionDetails } = await session.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? expression);
  return result.value;
}

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    "--hide-scrollbars",
    "--allow-file-access-from-files",
    `--window-size=${VIEW.width},${VIEW.height}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

try {
  let session;
  for (let attempt = 0; !session; attempt++) {
    try {
      session = await connect();
    } catch (error) {
      if (attempt > 50) throw error;
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  await session.send("Page.enable");
  await session.send("Emulation.setDeviceMetricsOverride", {
    width: VIEW.width,
    height: VIEW.height,
    deviceScaleFactor: VIEW.scale,
    mobile: false,
  });
  await session.send("Page.navigate", { url: stageOnlyCopy() });
  while (!session.events.includes("Page.loadEventFired"))
    await new Promise((r) => setTimeout(r, 50));
  // Give the page's own start-up (its textures) a moment.
  await new Promise((r) => setTimeout(r, 500));

  // The app's settings, not the prototype's own: the movie plays what the app would.
  await evaluate(session, `window.__intro.setParams(${JSON.stringify(SETTINGS)})`);
  const used = await evaluate(session, "window.__intro.params()");
  for (const [key, value] of Object.entries(SETTINGS)) {
    if (used[key] !== value) throw new Error(`The prototype didn't take ${key}=${value}`);
  }
  const total = await evaluate(session, "window.__intro.total()");
  const beats = await evaluate(session, "window.__intro.beats()");
  const firstHit = await evaluate(session, "window.__intro.firstHit()");
  const count = Math.ceil((total / 1000) * FPS) + 1;

  const started = Date.now();
  for (let i = 0; i < count; i++) {
    await evaluate(session, `window.__intro.seek(${(i * 1000) / FPS})`);
    const { data } = await session.send("Page.captureScreenshot", { format: "png" });
    writeFileSync(
      join(framesDir, `${String(i).padStart(5, "0")}.png`),
      Buffer.from(data, "base64"),
    );
    if (i % 60 === 0) {
      const each = (Date.now() - started) / (i + 1);
      console.log(`frame ${i + 1}/${count} · ${Math.round(((count - i - 1) * each) / 1000)}s left`);
    }
  }

  const movie = {
    fps: FPS,
    frames: count,
    width: VIEW.width * VIEW.scale,
    height: VIEW.height * VIEW.scale,
    stage: STAGE,
    durationMs: ((count - 1) * 1000) / FPS,
    settings: SETTINGS,
    beats,
    moments: { firstHit },
  };
  writeFileSync(join(framesDir, "movie.json"), `${JSON.stringify(movie, null, 2)}\n`);
  console.log(`Captured ${count} frames in ${Math.round((Date.now() - started) / 1000)}s.`);
  session.close();
} finally {
  chrome.kill();
}
