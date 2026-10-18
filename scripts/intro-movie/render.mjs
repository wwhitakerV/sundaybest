#!/usr/bin/env node
// Makes the launch intro's movie: captures every frame of the paint prototype
// with the app's settings, encodes them, and puts the movie and its timing where
// the app reads them.
//
//   npm run render:intro                       capture and encode (a few minutes)
//   npm run render:intro -- --frames <dir>     re-encode frames already captured
//   npm run render:intro -- --mbps 12          bitrate in megabits a second (default below)
//
// It writes assets/intro/paint-movie.mp4 and
// src/features/launch-intro/logic/movie/paint-movie.json. Run it after any
// change to the film's settings or to its prototype; a test fails until it's run.

import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const HERE = join(ROOT, "scripts/intro-movie");
const FPS = 120;
/**
 * Enough that the soft liquid edges don't block or band (checked frame by frame
 * against the capture): the paint movie comes out about 4.4 MB. The encoder's
 * own choice, about 4.5, blocked visibly.
 */
const DEFAULT_MBPS = 12;

const args = process.argv.slice(2);
const option = (name) => {
  const at = args.indexOf(`--${name}`);
  return at === -1 ? undefined : args[at + 1];
};
const mbps = Number(option("mbps") ?? DEFAULT_MBPS);
let frames = option("frames");
const MOVIE = join(ROOT, "assets/intro/paint-movie.mp4");
const TIMING = join(ROOT, "src/features/launch-intro/logic/movie/paint-movie.json");

/** Runs a step, stopping the render if it fails. */
function run(command, commandArgs) {
  const { status } = spawnSync(command, commandArgs, { stdio: "inherit" });
  if (status !== 0) process.exit(status ?? 1);
}

if (!frames) {
  frames = mkdtempSync(join(tmpdir(), "sundaybest-intro-"));
  console.log(`Capturing frames into ${frames}…`);
  run(process.execPath, ["--no-warnings", join(HERE, "capture-frames.mjs"), frames, String(FPS)]);
}

console.log(`Encoding at ${mbps} Mbps…`);
mkdirSync(dirname(MOVIE), { recursive: true });
run("swift", [join(HERE, "encode-movie.swift"), frames, MOVIE, String(FPS), String(mbps)]);
copyFileSync(join(frames, "movie.json"), TIMING);

const megabytes = (statSync(MOVIE).size / 1024 / 1024).toFixed(1);
console.log(`Done: ${MOVIE} (${megabytes} MB) and ${TIMING}.`);
console.log(`The frames are still in ${frames}, to re-encode: --frames ${frames}`);
