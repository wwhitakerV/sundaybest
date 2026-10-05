import type { ApiSermonSummary } from "@/core/api/contracts";
import { toSermonPreview, type SermonPreview } from "./search-sermons";

/** Converts the API's canonical sermon resource into the preview New Plan renders. */
export function lookUpSermon(sermon: ApiSermonSummary): SermonPreview {
  return toSermonPreview(sermon);
}
