import type { GenerationUsage } from "../../providers/plan-generation-provider.js";
import { rejections } from "../prompts/context.js";
import { parseResponse, type StageCaller, type StageEvent } from "../step-runner.js";
import { mapTitle, type SermonTitle } from "./map-title.js";
import { TITLE_INSTRUCTIONS, titleOutputSchema } from "./prompt.js";

/** Tries before the video's own title is shown instead. */
const TITLE_ATTEMPTS = 2;
/** A title is a small answer: a runaway or stuck call is cut off well before a plan step's would be. */
const LIMITS = { maxTokens: 2_000, timeoutMs: 30_000 };

/**
 * A sermon's own title, and its series and part, found in its video's title
 * by one small model call, asked again once when the answer isn't the video
 * title's words. Null after two failures — the video's own title is shown
 * then — and never a thrown error: a title never fails a plan.
 */
export async function findSermonTitle(
  call: StageCaller,
  video: { title: string; church: string | null },
  report?: (event: StageEvent) => void | Promise<void>,
): Promise<SermonTitle | null> {
  const rejected: string[] = [];
  for (let attempt = 1; attempt <= TITLE_ATTEMPTS; attempt++) {
    const started = Date.now();
    let usage: GenerationUsage | null = null;
    try {
      const response = await call({
        stage: "title", kind: "title", cacheKey: "sermon-titles", instructions: TITLE_INSTRUCTIONS,
        context: JSON.stringify({ videoTitle: video.title, channel: video.church }), task: JSON.stringify(rejections(rejected)),
        schema: titleOutputSchema, schemaName: "sundaybest_title", ...LIMITS,
      });
      usage = { model: response.model, finishReason: response.finishReason, ...response.usage, durationMs: Date.now() - started };
      const title = mapTitle(parseResponse(response, "title"), video.title);
      await report?.({ stage: "title", kind: "title", outcome: "accepted", error: null, usage });
      return title;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unknown failure";
      rejected.push(message);
      await report?.({ stage: "title", kind: "title", outcome: "rejected", error: message, usage });
    }
  }
  return null;
}
