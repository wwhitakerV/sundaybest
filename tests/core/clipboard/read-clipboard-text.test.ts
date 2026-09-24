import * as Clipboard from "expo-clipboard";

import { readClipboardText } from "@/core/clipboard/read-clipboard-text";

jest.mock("expo-clipboard", () => ({ getStringAsync: jest.fn() }));

describe("readClipboardText", () => {
  it("returns what was copied, trimmed", async () => {
    jest.mocked(Clipboard.getStringAsync).mockResolvedValue("  https://youtu.be/abc123\n");

    await expect(readClipboardText()).resolves.toBe("https://youtu.be/abc123");
  });

  it("returns nothing when the clipboard can't be read", async () => {
    jest.mocked(Clipboard.getStringAsync).mockRejectedValue(new Error("denied"));

    await expect(readClipboardText()).resolves.toBe("");
  });
});
