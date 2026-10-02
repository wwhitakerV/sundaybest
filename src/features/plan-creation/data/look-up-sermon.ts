import { lookUpMockSermon, type SermonPreview } from "@/core/plan-builder";

/**
 * The sermon a link points to. Today it's the mock catalogue; a real lookup
 * replaces this one function, and nothing above it changes.
 */
export function lookUpSermon(url: string): SermonPreview {
  return lookUpMockSermon(url);
}
