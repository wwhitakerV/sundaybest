import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
  WebBrowserResultType,
} from "expo-web-browser";

import { isAllowedPassageUrl } from "./passage-url";

/**
 * Opens a Bible passage on Bible Gateway in an in-app Safari sheet
 * (`SFSafariViewController`), over whatever is on screen — so an exam in
 * progress stays in the foreground and nothing is lost. See ADR 0014.
 *
 * The only way the app sends someone to another site, so it opens one
 * origin and nothing else: `https://www.biblegateway.com`, on the default
 * port, with no credentials, in canonical form (see `passage-url.ts`). The content is checked against the same rule
 * when it loads; this checks again, at the last moment. Never throws, and
 * never logs the URL.
 */

/** What happened: the sheet opened and was closed, the URL wasn't allowed, another sheet was already open, or opening failed. */
export type PassageLinkOutcome = "closed" | "refused" | "busy" | "failed";

/** Opens `url` in the in-app Safari sheet if it's allowed; resolves once the sheet closes. */
export async function openPassageLink(url: string): Promise<PassageLinkOutcome> {
  if (!isAllowedPassageUrl(url)) return "refused";
  try {
    const result = await openBrowserAsync(url, {
      presentationStyle: WebBrowserPresentationStyle.PAGE_SHEET,
      dismissButtonStyle: "done",
    });
    return result.type === WebBrowserResultType.LOCKED ? "busy" : "closed";
  } catch {
    return "failed";
  }
}
