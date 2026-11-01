#!/usr/bin/env node
// Copies the lucide icons Formation's objects are made from into the app, as
// plain SVG paths on lucide's 24-unit grid, so Skia can turn each into an
// object's relief: lucide-react-native doesn't export its drawings.
//
//   npm run build:formation-icons
//
// Reads each icon's own file in node_modules/lucide-react-native (its `node`
// list: paths, circles, rects, lines, polylines, polygons, ellipses), turns
// every element into a path, and writes
// src/features/formation/logic/formation-icons.ts. Add an icon by adding its
// lucide name to ICONS and running it again.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const LUCIDE = join(ROOT, "node_modules/lucide-react-native");
const OUT = join(ROOT, "src/features/formation/logic/formation-icons.ts");

/** The icons Formation draws: its board's, then the proof set — organic, straight-lined, busy, and plain. */
const ICONS = [
  "brain",
  "eye",
  "mouth",
  "shield-check",
  "heart",
  "flame",
  "hand",
  "book-open",
  "calendar-days",
  "cloud",
  "hand-helping",
  "biceps-flexed",
  "hand-heart",
  "footprints",
  "lightbulb",
  "scan-face",
  "ear",
  "speech",
];

/** `name` in camelCase: lucide's file name as a key. */
const keyOf = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

/** A circle or ellipse as two arcs. */
const ellipse = (cx, cy, rx, ry) =>
  `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0`;

/** A rectangle, its corners rounded by `rx`/`ry` if it has them. */
function rect({ x = 0, y = 0, width, height, rx, ry }) {
  const a = Math.min(Number(rx ?? ry ?? 0), width / 2);
  const b = Math.min(Number(ry ?? rx ?? 0), height / 2);
  if (!a && !b) return `M${x} ${y}h${width}v${height}h${-width}z`;
  return [
    `M${x + a} ${y}h${width - 2 * a}a${a} ${b} 0 0 1 ${a} ${b}v${height - 2 * b}`,
    `a${a} ${b} 0 0 1 ${-a} ${b}h${-(width - 2 * a)}a${a} ${b} 0 0 1 ${-a} ${-b}`,
    `v${-(height - 2 * b)}a${a} ${b} 0 0 1 ${a} ${-b}z`,
  ].join("");
}

/** A list of points as a path, closed if `close`. */
const points = (list, close) => {
  const xy = list
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  const steps = [];
  for (let i = 0; i < xy.length; i += 2) steps.push(`${i === 0 ? "M" : "L"}${xy[i]} ${xy[i + 1]}`);
  return steps.join("") + (close ? "z" : "");
};

/** One element of an icon's drawing, as a path. */
function pathOf([tag, a]) {
  const n = (k) => Number(a[k]);
  switch (tag) {
    case "path":
      return a.d;
    case "circle":
      return ellipse(n("cx"), n("cy"), n("r"), n("r"));
    case "ellipse":
      return ellipse(n("cx"), n("cy"), n("rx"), n("ry"));
    case "rect":
      return rect({ ...a, x: n("x"), y: n("y"), width: n("width"), height: n("height") });
    case "line":
      return `M${n("x1")} ${n("y1")}L${n("x2")} ${n("y2")}`;
    case "polyline":
      return points(a.points, false);
    case "polygon":
      return points(a.points, true);
    default:
      throw new Error(`Unknown element <${tag}>`);
  }
}

/**
 * The text of the `node` list in an icon's file: from its opening bracket to
 * the one that closes it (strings skipped), whatever follows it (`aliases`).
 */
function nodeListOf(text) {
  const start = text.indexOf("[", text.search(/node:\s*\[/));
  if (start < 0) return null;
  let depth = 0;
  let quoted = false;
  for (let i = start; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === "\\") i += 1;
      else if (c === '"') quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === "[") depth += 1;
    else if (c === "]" && (depth -= 1) === 0) return text.slice(start, i + 1);
  }
  return null;
}

/** An icon's drawing, read from its file in the package: its `node` list, a plain literal. */
function drawingOf(name) {
  const text = readFileSync(join(LUCIDE, "dist/esm/icons", `${name}.mjs`), "utf8");
  const found = nodeListOf(text);
  if (!found) throw new Error(`No drawing found for ${name}`);
  // The list is a plain literal of arrays, objects and strings: read it as JSON.
  const json = found
    .replace(/([{,]\s*)([A-Za-z][\w-]*)\s*:/g, '$1"$2":')
    .replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(json).map(pathOf);
}

const version = JSON.parse(readFileSync(join(LUCIDE, "package.json"), "utf8")).version;
const entries = ICONS.map((name) => `  ${keyOf(name)}: ${JSON.stringify(drawingOf(name))},`);

writeFileSync(
  OUT,
  `/**
 * The lucide icons Formation's objects are made from, each as its drawing's
 * paths on lucide's 24-unit grid, drawn at its 2-unit stroke. Generated from
 * lucide-react-native ${version} by \`npm run build:formation-icons\`
 * (scripts/formation/icons.mjs): don't edit by hand. Data only.
 */

export type FormationIcon = ${ICONS.map((name) => JSON.stringify(keyOf(name))).join(" | ")};

export const FORMATION_ICONS: Record<FormationIcon, readonly string[]> = {
${entries.join("\n")}
};
`,
);
console.log(`Wrote ${ICONS.length} icons to ${OUT}`);
