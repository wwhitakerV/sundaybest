import type { RefObject } from "react";
import { Share, type View } from "react-native";
import { ImageFormat, makeImageFromView } from "@shopify/react-native-skia";

/** Full quality: a picture of words, its edges kept crisp. */
const PNG_QUALITY = 100;

/**
 * A view's picture, as a base64 PNG — drawn by Skia from the view as it's laid
 * out, on or off the screen. Nothing when it can't be taken (no native Skia, a
 * view not laid out yet): what's being shared goes as words alone.
 */
export async function snapshotPng(view: RefObject<View | null>): Promise<string | null> {
  try {
    const image = await makeImageFromView(view);
    return image ? image.encodeToBase64(ImageFormat.PNG, PNG_QUALITY) : null;
  } catch {
    return null;
  }
}

/**
 * iOS's own share sheet — half the screen, the reader's apps in it: Messages,
 * Mail, AirDrop, their social apps, Copy — with the words, and the picture
 * when there is one. Resolves once the sheet is put away, shared or not.
 */
export async function openShareSheet({
  message,
  png,
}: {
  message: string;
  png?: string | null;
}): Promise<void> {
  await Share.share(png ? { message, url: `data:image/png;base64,${png}` } : { message });
}
