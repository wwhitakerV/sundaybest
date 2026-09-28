import * as WebBrowser from "expo-web-browser";

import { openPassageLink } from "@/core/links/open-passage-link";

// `expo-web-browser` is mocked globally in tests/setup/jest.setup.ts:
// `openBrowserAsync` resolves `{ type: "cancel" }` unless a test overrides it.

describe("openPassageLink", () => {
  const ALLOWED_URL = "https://www.biblegateway.com/passage/?search=John+3";

  it("refuses a disallowed URL without ever calling the browser", async () => {
    await expect(openPassageLink("https://evil.com/")).resolves.toBe("refused");
    expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
  });

  it("opens an allowed URL in a page-sheet presentation", async () => {
    await openPassageLink(ALLOWED_URL);

    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(
      ALLOWED_URL,
      expect.objectContaining({ presentationStyle: "pageSheet" }),
    );
  });

  it("resolves closed when the reader dismisses the sheet", async () => {
    jest
      .mocked(WebBrowser.openBrowserAsync)
      .mockResolvedValueOnce({ type: WebBrowser.WebBrowserResultType.DISMISS });

    await expect(openPassageLink(ALLOWED_URL)).resolves.toBe("closed");
  });

  it("resolves closed when the sheet is cancelled", async () => {
    jest
      .mocked(WebBrowser.openBrowserAsync)
      .mockResolvedValueOnce({ type: WebBrowser.WebBrowserResultType.CANCEL });

    await expect(openPassageLink(ALLOWED_URL)).resolves.toBe("closed");
  });

  it("resolves busy when another browser sheet is already open", async () => {
    jest
      .mocked(WebBrowser.openBrowserAsync)
      .mockResolvedValueOnce({ type: WebBrowser.WebBrowserResultType.LOCKED });

    await expect(openPassageLink(ALLOWED_URL)).resolves.toBe("busy");
  });

  it("resolves failed, never throwing, when the browser rejects", async () => {
    jest.mocked(WebBrowser.openBrowserAsync).mockRejectedValueOnce(new Error("no browser"));

    await expect(openPassageLink(ALLOWED_URL)).resolves.toBe("failed");
  });
});
