import { isAllowedPassageUrl } from "@/core/links/passage-url";

describe("isAllowedPassageUrl", () => {
  it("allows a Bible Gateway passage URL", () => {
    expect(isAllowedPassageUrl("https://www.biblegateway.com/passage/?search=John+3%3A16")).toBe(
      true,
    );
  });

  it("allows a Bible Gateway URL with a bare path and no query", () => {
    expect(isAllowedPassageUrl("https://www.biblegateway.com/passage/")).toBe(true);
  });

  it("refuses a plain http URL", () => {
    expect(isAllowedPassageUrl("http://www.biblegateway.com/passage/")).toBe(false);
  });

  it("refuses biblegateway.com without the www subdomain", () => {
    expect(isAllowedPassageUrl("https://biblegateway.com/passage/")).toBe(false);
  });

  it("refuses an unrelated host", () => {
    expect(isAllowedPassageUrl("https://evil.com/")).toBe(false);
  });

  it("refuses a host that only looks like it starts with the allowed one", () => {
    expect(isAllowedPassageUrl("https://www.biblegateway.com.evil.com/")).toBe(false);
  });

  it("refuses a URL carrying userinfo before the host", () => {
    expect(isAllowedPassageUrl("https://user@www.biblegateway.com/")).toBe(false);
  });

  it("refuses a non-default port", () => {
    expect(isAllowedPassageUrl("https://www.biblegateway.com:8443/passage/")).toBe(false);
  });

  it("refuses a string that cannot be parsed as a URL", () => {
    expect(isAllowedPassageUrl("not a url")).toBe(false);
  });

  it("refuses an empty string", () => {
    expect(isAllowedPassageUrl("")).toBe(false);
  });

  it("refuses a javascript: URL", () => {
    expect(isAllowedPassageUrl("javascript:alert(1)")).toBe(false);
  });

  // WHATWG parsers (Node's, and the app's polyfill) read these as Bible
  // Gateway; iOS's URL(string:) — which the browser actually opens — does
  // not. Only the canonical form both agree on is allowed.
  it("refuses a backslash that iOS reads as userinfo before another host", () => {
    expect(isAllowedPassageUrl("https://www.biblegateway.com\\@evil.com/")).toBe(false);
  });

  it("refuses a tab inside the URL", () => {
    expect(isAllowedPassageUrl("https://www.biblegateway.com/pass\tage/")).toBe(false);
  });

  it("refuses leading whitespace", () => {
    expect(isAllowedPassageUrl(" https://www.biblegateway.com/passage/")).toBe(false);
  });

  it("refuses the scheme-without-slashes shorthand", () => {
    expect(isAllowedPassageUrl("https:www.biblegateway.com/passage/")).toBe(false);
  });
});
