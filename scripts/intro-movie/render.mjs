#!/usr/bin/env node
// Makes a launch intro's movie: captures every frame from its prototype with
// the app's settings, encodes them, and puts the movie and its timing where the
// app reads them.
//
//   npm run render:intro                       the pool film: capture and encode (about 30 minutes)
//   npm run render:intro -- --film water       the water film (v4's)
//   npm run render:intro -- --frames <dir>     re-encode frames already captured
//   npm run render:intro -- --mbps 12          bitrate in megabits a second (default below)
//
// The pool film writes assets/intro/pool-movie.mp4 and
// src/features/launch-intro/logic/movie/pool-movie.json; the water film,
// water-intro.mp4 and water-movie.json. Run it after any change to the film's
// settings or to its prototype; a test fails until it's run.

import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const HERE = join(ROOT, "scripts/intro-movie");
const FILMS = {
  pool: { movie: "assets/intro/pool-movie.mp4", timing: "pool-movie.json" },
  water: { movie: "assets/intro/water-intro.mp4", timing: "water-movie.json" },
};
const FPS = 120;
/**
 * Enough that the water's soft gradients don't block or band and the caustics
 * inside the letters survive (checked frame by frame against the capture): about
 * 15 MB. The encoder's own choice, about 4.5, blocked visibly.
 */
const DEFAULT_MBPS = 12;

const args = process.argv.slice(2);
const option = (name) => {
  const at = args.indexOf(`--${name}`);
  return at === -1 ? undefined : args[at + 1];
};
const mbps = Number(option("mbps") ?? DEFAULT_MBPS);
let frames = option("frames");
const filmName = option("film") ?? "pool";
const film = FILMS[filmName];
if (!film) {
  console.error(`No film "${filmName}": pool or water.`);
  process.exit(1);
}
const MOVIE = join(ROOT, film.movie);
const TIMING = join(ROOT, "src/features/launch-intro/logic/movie", film.timing);

/** Runs a step, stopping the render if it fails. */
function run(command, commandArgs) {
  const { status } = spawnSync(command, commandArgs, { stdio: "inherit" });
  if (status !== 0) process.exit(status ?? 1);
}

if (!frames) {
  frames = mkdtempSync(join(tmpdir(), "sundaybest-intro-"));
  console.log(`Capturing frames into ${frames}…`);
  run(process.execPath, [
    "--no-warnings",
    join(HERE, "capture-frames.mjs"),
    frames,
    String(FPS),
    filmName,
  ]);
}

console.log(`Encoding at ${mbps} Mbps…`);
mkdirSync(dirname(MOVIE), { recursive: true });
run("swift", [join(HERE, "encode-movie.swift"), frames, MOVIE, String(FPS), String(mbps)]);
copyFileSync(join(frames, "movie.json"), TIMING);

const megabytes = (statSync(MOVIE).size / 1024 / 1024).toFixed(1);
console.log(`Done: ${MOVIE} (${megabytes} MB) and ${TIMING}.`);
console.log(`The frames are still in ${frames}, to re-encode: --frames ${frames}`);
