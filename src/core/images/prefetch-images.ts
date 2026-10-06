import { Image } from "expo-image";

/**
 * Downloads and caches artwork the reader is about to see — the plans on
 * their list, the plan they're likely to open — so it draws at once when it
 * does. A failure costs nothing: the image simply loads when shown.
 */
export function prefetchImages(urls: readonly (string | null | undefined)[]): void {
  const wanted = urls.filter((url): url is string => typeof url === "string" && url.length > 0);
  if (wanted.length === 0) return;
  void Image.prefetch(wanted, { cachePolicy: "memory-disk" }).catch(() => false);
}
