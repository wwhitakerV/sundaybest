import { z } from "zod";

/**
 * The deep-link gate.
 *
 * Any app on the device can hand us a `sundaybest://` URL, and the web can hand
 * us a universal link. Both are attacker-controlled input arriving at the one
 * inbound edge the app cannot close, so this module treats every URL as hostile
 * until it matches an allowlist.
 *
 * Pure on purpose: no React, no navigation, no logging. `src/app/+native-intent.tsx`
 * is the thin adapter that expo-router calls.
 */

/** Where anything unrecognised goes. */
export const HOME_PATH = "/";

/** Schemes the app answers to. `https` covers universal links. */
const ALLOWED_SCHEMES = new Set(["sundaybest", "https"]);

/** Hosts accepted on an `https` link. */
const ALLOWED_HOSTS = new Set(["sundaybest.com", "www.sundaybest.com"]);

/**
 * A URL longer than this is rejected before being parsed or matched.
 *
 * Not arbitrary defensiveness: parsing, decoding, and matching a
 * megabyte-long URL on the main thread during app launch is a free
 * denial-of-service, and no legitimate link to this app is anywhere near it.
 */
const MAX_URL_LENGTH = 2048;

/**
 * Every route reachable by deep link, with the params it accepts.
 *
 * Deliberately tiny: the app has one screen. A route absent from this table is
 * not reachable from outside the app, which is the correct default — adding a
 * route to `src/app` should not silently widen the attack surface.
 */
const ALLOWED_ROUTES: readonly { readonly path: string; readonly params: z.ZodType }[] = [
  { path: "/", params: z.object({}) },
  { path: "/index", params: z.object({}) },
];

type RejectionReason =
  | "not-a-string"
  | "too-long"
  | "unparseable"
  | "scheme-not-allowed"
  | "host-not-allowed"
  | "route-not-allowed"
  | "params-not-allowed";

export type DeepLinkDecision =
  | { allowed: true; path: string }
  | { allowed: false; path: typeof HOME_PATH; reason: RejectionReason };

function reject(reason: RejectionReason): DeepLinkDecision {
  return { allowed: false, path: HOME_PATH, reason };
}

/**
 * Control characters, DEL, or a backslash: none of which belong in a path.
 *
 * A loop over code points rather than a regex character class, on purpose. The
 * regex form needs backslash-u escapes, and those kept reaching disk as
 * *literal* control bytes, which makes git treat this source file as binary.
 * This version is plain text and says exactly what it means.
 */
function hasForbiddenCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;

    // C0 control range, DEL, and a backslash used as a separator.
    if (code < 0x20 || code === 0x7f || character === "\\") return true;
  }

  return false;
}

const PERCENT_ESCAPE = /%[0-9a-f]{2}/i;

/**
 * Decides where an inbound URL may go.
 *
 * Returns a decision rather than the URL it was given: nothing downstream needs
 * the original, and not returning it is what makes it impossible to log by
 * accident.
 */
export function validateDeepLink(url: string): DeepLinkDecision {
  // The OS hands this over, so the type is a hope rather than a guarantee.
  if (typeof url !== "string") return reject("not-a-string");
  if (url.length > MAX_URL_LENGTH) return reject("too-long");

  let parsed: URL;
  try {
    // A relative path is what expo-router passes most of the time, so it is
    // resolved against a fixed base. The base's host is then indistinguishable
    // from an allowed one, which is why the scheme is read from the parsed
    // protocol and the host is only checked for `https` links.
    parsed = new URL(url, "sundaybest://sundaybest.com");
  } catch {
    return reject("unparseable");
  }

  const scheme = parsed.protocol.replace(/:$/, "").toLowerCase();
  if (!ALLOWED_SCHEMES.has(scheme)) return reject("scheme-not-allowed");

  // Only an https link carries a meaningful host; a custom-scheme URL's host is
  // an artefact of the base above.
  if (scheme === "https" && !ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) {
    return reject("host-not-allowed");
  }

  const path = normalisePath(parsed.pathname);
  if (path === null) return reject("route-not-allowed");

  const route = ALLOWED_ROUTES.find((candidate) => candidate.path === path);
  if (route === undefined) return reject("route-not-allowed");

  const params = Object.fromEntries(parsed.searchParams.entries());
  if (!route.params.safeParse(params).success) return reject("params-not-allowed");

  // The matched route's own path, never the caller's string — so a route can
  // never be reached by a spelling of it that merely compared equal.
  return { allowed: true, path: route.path };
}

/**
 * Canonicalises a path before it is compared, or returns `null` if it cannot be
 * trusted.
 *
 * Matching the allowlist against raw text is the bug this prevents: `/%61dmin`
 * and `/admin` are the same route to the OS and different strings to a naive
 * comparison. Decoding first, then rejecting anything still suspicious, means
 * the comparison always happens on one canonical form.
 */
function normalisePath(pathname: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // Malformed percent-encoding. Nothing legitimate produces it.
    return null;
  }

  // Still escaped after one decode means someone is trying to make a decoder
  // and a matcher disagree.
  if (decoded !== pathname && PERCENT_ESCAPE.test(decoded)) return null;

  if (hasForbiddenCharacter(decoded)) return null;

  // Dot-segments a string comparison would not resolve.
  if (decoded.split("/").some((segment) => segment === "." || segment === "..")) return null;

  // Leading or trailing whitespace, which reads as an allowed route and is not.
  if (decoded !== decoded.trim()) return null;

  // `//index` and `/index/` are the same route as `/index`.
  const collapsed = decoded.replace(/\/{2,}/g, "/").replace(/(.)\/$/, "$1");

  return collapsed === "" ? HOME_PATH : collapsed;
}

/**
 * A log line for a rejected link, or `null` when there is nothing to report.
 *
 * Returns the reason and never the URL. This is the function to reach for
 * instead of interpolating a link into a message.
 */
export function describeDecision(decision: DeepLinkDecision): string | null {
  if (decision.allowed) return null;

  return `Deep link rejected: ${decision.reason}`;
}
