import * as Clipboard from "expo-clipboard";

/**
 * The text on the clipboard, trimmed — or "" if there's none, or it can't be
 * read. Only ever called when the user taps Paste, so iOS's paste prompt is
 * theirs to answer; nothing reads the clipboard on its own.
 */
export async function readClipboardText(): Promise<string> {
  try {
    return (await Clipboard.getStringAsync()).trim();
  } catch {
    return "";
  }
}
