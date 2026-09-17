#!/usr/bin/env node
// Validates the repo's .env files against the schema the app itself enforces.
//
//   npm run check:env
//
// Part of `npm run validate`, so a .env that would crash the app at launch is
// caught by the same gate as a type error.
//
// It imports src/core/config/env-schema.ts directly — Node strips the types —
// rather than re-declaring the rules here. A second copy of a validation schema
// is a second copy that drifts, and the drift is silent.
//
// It prints file names and failing variable names, never values. This runs in CI
// logs, and a value that failed validation is exactly the kind of thing someone
// pasted into the wrong variable by mistake.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const { parseEnv } = await import("../src/core/config/env-schema.ts");

/**
 * A deliberately small .env parser: `KEY=value`, `#` comments, blank lines, an
 * optional `export ` prefix, and optional surrounding quotes.
 *
 * It does not do variable expansion or multi-line values. If a .env file ever
 * needs those, this should switch to whatever Expo's CLI uses rather than
 * growing — the point of this script is to check the same bytes the app will see.
 */
function parseDotEnv(contents) {
  const values = {};

  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator === -1) continue;

    const key = line
      .slice(0, separator)
      .replace(/^export\s+/, "")
      .trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

/** Every .env file in the repo root, plus .env.example, in a stable order. */
function findEnvFiles() {
  return readdirSync(PROJECT_ROOT)
    .filter((name) => name === ".env" || name.startsWith(".env."))
    .sort();
}

const files = findEnvFiles();

if (files.length === 0) {
  console.error("check-env: no .env files found, and .env.example is missing.");
  process.exit(1);
}

let failed = false;
let sawLocalEnv = false;

for (const file of files) {
  if (file === ".env" || file.endsWith(".local")) sawLocalEnv = true;

  let values;
  try {
    values = parseDotEnv(readFileSync(join(PROJECT_ROOT, file), "utf8"));
  } catch (error) {
    console.error(`✖ ${file}: could not be read (${error.code ?? "unknown error"})`);
    failed = true;
    continue;
  }

  try {
    parseEnv(values);
    console.log(`✔ ${file}`);
  } catch (error) {
    failed = true;
    const fields = Array.isArray(error.fields) ? error.fields : [];
    console.error(`✖ ${file}`);
    for (const field of fields) {
      console.error(`    ${field}`);
    }
    if (fields.length === 0) {
      console.error(`    ${error.message}`);
    }
  }
}

if (!failed && !sawLocalEnv) {
  console.log("\nNote: no .env in this checkout. Run `cp .env.example .env` before `npm start`.");
}

if (failed) {
  console.error(
    "\nValues are not shown on purpose. See .env.example for what each variable expects.",
  );
  process.exit(1);
}
