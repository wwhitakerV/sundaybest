import {
  HOME_PATH,
  describeDecision,
  validateDeepLink,
} from "@/core/security/deep-links/validate-deep-link";

describe("validateDeepLink", () => {
  describe("allows what is on the list", () => {
    it.each([
      ["/", "/"],
      ["/index", "/index"],
    ])("accepts %p and resolves it to %p", (path, expected) => {
      expect(validateDeepLink(path)).toEqual({ allowed: true, path: expected });
    });

    it("keeps the app scheme's host-style root", () => {
      // `sundaybest://` arrives as an empty path once the scheme is stripped.
      expect(validateDeepLink("sundaybest://")).toEqual({ allowed: true, path: HOME_PATH });
    });

    /**
     * Not a rejection: an empty path is a cold launch with no deep link at all,
     * which is a legitimate way for the app to start. It reaches the same screen
     * as a rejection would, but calling it "rejected" would put a security event
     * in the log every time someone taps the icon.
     */
    it("treats an empty path as a launch with no link", () => {
      expect(validateDeepLink("")).toEqual({ allowed: true, path: HOME_PATH });
    });

    it("accepts a full universal link to an allowed route", () => {
      expect(validateDeepLink("https://sundaybest.com/")).toEqual({
        allowed: true,
        path: HOME_PATH,
      });
    });
  });

  /**
   * The safe answer to a link we do not recognise is the home screen, not a
   * guess and not a crash. Every rejection carries a machine-readable reason so
   * the caller has something to log that is not the URL.
   */
  describe("sends everything else home", () => {
    it.each([
      ["an unknown route", "/admin"],
      ["a route that only looks allowed", "/index-secret"],
      ["a nested unknown route", "/settings/danger"],
    ])("rejects %s", (_label, path) => {
      expect(validateDeepLink(path)).toEqual({
        allowed: false,
        path: HOME_PATH,
        reason: "route-not-allowed",
      });
    });

    it("rejects a foreign host on a universal link", () => {
      expect(validateDeepLink("https://evil.example.com/")).toEqual({
        allowed: false,
        path: HOME_PATH,
        reason: "host-not-allowed",
      });
    });

    it("rejects a foreign scheme", () => {
      expect(validateDeepLink("javascript:alert(1)")).toEqual({
        allowed: false,
        path: HOME_PATH,
        reason: "scheme-not-allowed",
      });
    });

    /**
     * `new URL(path, base)` swallows most nonsense — `"://///"` parses happily
     * as a relative path. These are inputs that genuinely make it throw, which
     * is the branch worth covering: an unmatched IPv6 bracket, a space in the
     * authority, a bare percent in the host.
     */
    it.each([
      ["an unmatched bracket", "https://["],
      ["a truncated ipv6 host", "https://[::1"],
      ["a space in the authority", "http://a b"],
      ["a bare percent in the host", "https://%"],
    ])("rejects %s as unparseable", (_label, url) => {
      expect(validateDeepLink(url)).toEqual({
        allowed: false,
        path: HOME_PATH,
        reason: "unparseable",
      });
    });

    it("rejects something that merely looks unparseable but is not", () => {
      // Parses as the relative path "/://///", which is simply not a route.
      expect(validateDeepLink("://///")).toEqual({
        allowed: false,
        path: HOME_PATH,
        reason: "route-not-allowed",
      });
    });

    it("rejects a non-string, which the types should prevent but the OS does not", () => {
      expect(validateDeepLink(undefined as unknown as string)).toEqual({
        allowed: false,
        path: HOME_PATH,
        reason: "not-a-string",
      });
    });
  });

  /**
   * Traversal and encoding tricks. The allowlist is matched against a decoded,
   * normalised path, so `/%61dmin` cannot smuggle `/admin` past a comparison
   * done on the raw text.
   */
  describe("resists the usual tricks", () => {
    it.each([
      ["percent-encoded", "/%61dmin"],
      ["double-encoded", "/%2561dmin"],
      ["dot-segment traversal", "/./../admin"],
      ["backslash separator", "/\\admin"],
      ["a null byte", "/%00admin"],
      ["a trailing-space variant of an allowed route", "/index%20"],
      // Malformed percent-encoding: the URL parser leaves these alone and
      // decodeURIComponent throws on them.
      ["a bare percent", "/%"],
      ["a non-hex escape", "/%zz"],
      ["a truncated utf-8 escape", "/%e0%a4%a"],
    ])("does not let %s through", (_label, path) => {
      expect(validateDeepLink(path).allowed).toBe(false);
    });

    it("ignores a query string and a fragment when matching", () => {
      expect(validateDeepLink("/?utm=x#frag")).toEqual({ allowed: true, path: HOME_PATH });
    });

    /**
     * A very long URL is a cheap denial-of-service against anything that parses
     * or logs it, so it is rejected on length before any further work.
     */
    it("rejects an absurdly long url without parsing it", () => {
      expect(validateDeepLink(`/${"a".repeat(5000)}`)).toEqual({
        allowed: false,
        path: HOME_PATH,
        reason: "too-long",
      });
    });
  });

  /**
   * The rule this module exists to enforce. A deep link is attacker-controlled
   * text handed over by any app on the device; putting it in a log is how it
   * reaches a crash report or a log aggregator.
   */
  describe("never exposes the url it rejected", () => {
    const planted = "/admin?token=FAKE-CREDENTIAL-SHAPED-STRING";

    it("keeps the url out of the decision", () => {
      expect(JSON.stringify(validateDeepLink(planted))).not.toContain("FAKE-CREDENTIAL");
    });

    it("keeps the url out of the loggable description", () => {
      const description = describeDecision(validateDeepLink(planted));

      expect(description).not.toContain("FAKE-CREDENTIAL");
      expect(description).not.toContain("admin");
      expect(description).toContain("route-not-allowed");
    });
  });
});

describe("describeDecision", () => {
  it("says nothing for an allowed link, because that is not an event", () => {
    expect(describeDecision({ allowed: true, path: HOME_PATH })).toBeNull();
  });
});
