import { createRef } from "react";
import { Share, type View } from "react-native";
import { makeImageFromView } from "@shopify/react-native-skia";

import { openShareSheet, snapshotPng } from "@/core/sharing/share-sheet";

let shareSpy: jest.SpiedFunction<typeof Share.share>;

beforeEach(() => {
  shareSpy = jest.spyOn(Share, "share").mockResolvedValue({ action: Share.sharedAction });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("openShareSheet", () => {
  it("opens iOS's share sheet with the words alone when there's no picture", async () => {
    await openShareSheet({ message: "“Rejoice always.”\n1 Thessalonians 5:16 (BSB)" });

    expect(shareSpy).toHaveBeenCalledWith({
      message: "“Rejoice always.”\n1 Thessalonians 5:16 (BSB)",
    });
  });

  it("shares the picture with the words, as a PNG", async () => {
    await openShareSheet({ message: "“Rejoice always.”", png: "cG5n" });

    expect(shareSpy).toHaveBeenCalledWith({
      message: "“Rejoice always.”",
      url: "data:image/png;base64,cG5n",
    });
  });
});

describe("snapshotPng", () => {
  it("takes a view's picture as a PNG", async () => {
    const encodeToBase64 = jest.fn(() => "cG5n");
    jest.mocked(makeImageFromView).mockResolvedValueOnce({ encodeToBase64 } as never);

    expect(await snapshotPng(createRef<View>())).toBe("cG5n");
    expect(encodeToBase64).toHaveBeenCalledWith(4, 100);
  });

  it("gives nothing when there's no picture to take, so the words go alone", async () => {
    jest.mocked(makeImageFromView).mockResolvedValueOnce(null);

    expect(await snapshotPng(createRef<View>())).toBeNull();
  });

  it("gives nothing when taking it fails", async () => {
    jest.mocked(makeImageFromView).mockRejectedValueOnce(new Error("no view"));

    expect(await snapshotPng(createRef<View>())).toBeNull();
  });
});
