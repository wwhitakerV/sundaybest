#!/usr/bin/env node
// Computes the next release version from Conventional Commits since the last
// tag, and — only with --apply — bumps package.json, writes a CHANGELOG.md
// section, tags, and pushes.
//
//   node scripts/release.mjs            # dry run: prints what it would do
//   node scripts/release.mjs --apply    # bumps, tags, and pushes for real
//
// Hand-rolled rather than a library (conventional-changelog-cli and friends)
// because this is a single-maintainer project's release script, not a
// shared tool — full control over the changelog format and one fewer
// dependency chain to keep current, at the cost of only handling this
// project's actual commit style rather than every edge case Conventional
// Commits allows. See docs/adr/0009-eas-build-submit-and-update-pipeline.md.
//
// Pushing a v*.*.* tag is what .eas/workflows/build-production.yml's
// `push.tags` trigger is watching for.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE_JSON_PATH = resolve(PROJECT_ROOT, "package.json");
const CHANGELOG_PATH = resolve(PROJECT_ROOT, "CHANGELOG.md");

const APPLY = process.argv.includes("--apply");

function git(args, options = {}) {
  return execFileSync("git", args, { cwd: PROJECT_ROOT, encoding: "utf8", ...options }).trim();
}

/** The most recent `v*.*.*` tag reachable from HEAD, or null if there isn't one. */
function lastTag() {
  try {
    // stderr suppressed: "no tags yet" is an expected, handled outcome for
    // a project's first release, not a failure worth alarming the console.
    return git(["describe", "--tags", "--abbrev=0", "--match=v*.*.*"], {
      stdio: ["pipe", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

/** One commit subject plus its full body, for BREAKING CHANGE footer detection. */
function commitsSince(tag) {
  const range = tag === null ? "HEAD" : `${tag}..HEAD`;
  // %x00 as a record separator: commit messages can contain newlines, but
  // not this byte, so splitting on it is safe where splitting on "\n" isn't.
  const raw = git(["log", range, "--format=%H%x01%s%x01%b%x00"]);
  if (raw === "") return [];

  return (
    raw
      .split("\0")
      // git's `--format` always appends its own trailing newline after each
      // record, which becomes a *leading* newline on the next record once
      // split on the `\x00` separator — trim before filtering, or the next
      // record's hash comes back as "\n<hash>".
      .map((record) => record.trim())
      .filter((record) => record !== "")
      .map((record) => {
        const [hash, subject, body] = record.split("\x01");
        return { hash, subject: subject ?? "", body: body ?? "" };
      })
  );
}

// eslint-disable-next-line security/detect-unsafe-regex -- no nested quantifiers to backtrack on, and the input is this repo's own commit history, not attacker-controlled text; verified linear-time against a 100-char adversarial string.
const CONVENTIONAL_COMMIT = /^(\w+)(\([^)]*\))?(!)?:\s*(.+)$/;

/** "major" | "minor" | "patch" | null (doesn't affect the version, e.g. "chore"). */
function classify({ subject, body }) {
  const match = CONVENTIONAL_COMMIT.exec(subject);
  if (!match) return { bump: null, type: null };

  const [, type, , breakingBang] = match;
  const hasBreakingFooter = /^BREAKING CHANGE:/m.test(body);

  if (breakingBang || hasBreakingFooter) return { bump: "major", type };
  if (type === "feat") return { bump: "minor", type };
  if (type === "fix" || type === "perf") return { bump: "patch", type };
  return { bump: null, type };
}

const BUMP_RANK = { major: 3, minor: 2, patch: 1 };

function highestBump(classifications) {
  let highest = null;
  for (const { bump } of classifications) {
    if (bump === null) continue;
    if (highest === null || BUMP_RANK[bump] > BUMP_RANK[highest]) highest = bump;
  }
  return highest;
}

function nextVersion(current, bump) {
  const [major, minor, patch] = current.split(".").map(Number);
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

const CHANGELOG_SECTIONS = [
  { type: "feat", heading: "Added" },
  { type: "fix", heading: "Fixed" },
  { type: "perf", heading: "Changed" },
];

function buildChangelogEntry(version, commits, classifications) {
  const date = new Date().toISOString().slice(0, 10);
  const lines = [`## ${version} — ${date}`, ""];

  for (const { type, heading } of CHANGELOG_SECTIONS) {
    const matching = commits.filter((_, i) => classifications[i].type === type);
    if (matching.length === 0) continue;

    lines.push(`### ${heading}`, "");
    for (const commit of matching) {
      lines.push(`- ${commit.subject} (${commit.hash.slice(0, 7)})`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function main() {
  const tag = lastTag();
  const commits = commitsSince(tag);

  if (commits.length === 0) {
    console.log(tag === null ? "No commits found." : `No commits since ${tag}.`);
    process.exit(0);
  }

  const classifications = commits.map(classify);
  const bump = highestBump(classifications);

  if (bump === null) {
    console.log(
      `${commits.length} commit(s) since ${tag ?? "the beginning"}, none of them ` +
        "feat/fix/perf or breaking — nothing to release.",
    );
    process.exit(0);
  }

  const packageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf8"));
  const version = nextVersion(packageJson.version, bump);
  const tagName = `v${version}`;
  const changelogEntry = buildChangelogEntry(version, commits, classifications);

  console.log(`Current version: ${packageJson.version}`);
  console.log(`Highest bump:    ${bump}`);
  console.log(`Next version:    ${version}\n`);
  console.log(changelogEntry);

  if (!APPLY) {
    console.log("Dry run — nothing changed. Re-run with --apply to bump, tag, and push.");
    return;
  }

  packageJson.version = version;
  writeFileSync(PACKAGE_JSON_PATH, `${JSON.stringify(packageJson, null, 2)}\n`);

  const existingChangelog = (() => {
    try {
      return readFileSync(CHANGELOG_PATH, "utf8");
    } catch {
      return "# Changelog\n\n";
    }
  })();
  writeFileSync(CHANGELOG_PATH, existingChangelog.replace(/\n*$/, "\n\n") + changelogEntry + "\n");

  git(["add", "package.json", "package-lock.json", "CHANGELOG.md"]);
  git(["commit", "-m", `chore(release): ${tagName}`]);
  git(["tag", "-a", tagName, "-m", tagName]);
  git(["push", "origin", "HEAD"]);
  git(["push", "origin", tagName]);

  console.log(`\nPushed ${tagName} — this triggers .eas/workflows/build-production.yml.`);
}

main();
