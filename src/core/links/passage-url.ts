/**
 * The one rule for where a passage link may go: `https://www.biblegateway.com`,
 * on the default port, with no credentials, written in canonical form. Pure —
 * checked when exam content loads, and again by `openPassageLink` at the
 * moment it opens.
 *
 * Canonical form matters because two parsers read the URL: this check uses
 * the WHATWG parser, but iOS opens the raw string with `URL(string:)`, which
 * reads some strings differently — `https://www.biblegateway.com\@evil.com/`
 * is Bible Gateway to one and evil.com to the other. A URL whose `href` is
 * exactly the string given means the same thing to both.
 */

const ALLOWED_ORIGIN = { protocol: "https:", hostname: "www.biblegateway.com" } as const;

/** Whether `url` is a Bible Gateway page this app may open. */
export function isAllowedPassageUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return (
    parsed.href === url &&
    parsed.protocol === ALLOWED_ORIGIN.protocol &&
    parsed.hostname === ALLOWED_ORIGIN.hostname &&
    parsed.port === "" &&
    parsed.username === "" &&
    parsed.password === ""
  );
}
