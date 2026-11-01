import assert from "node:assert/strict";
import test from "node:test";
import { dayClips } from "../src/generation/day-clip.js";
import { mapOutline } from "../src/generation/stages/outline.js";
import { generationInput, outlineOutput } from "./fixtures/generation.js";

test("each day's clip runs from where its first point is made to where the next day's begins", () => {
  const input = generationInput(3);
  const outline = mapOutline(outlineOutput(3), input);
  assert.deepEqual(dayClips(outline, input), [
    { clipStartSeconds: 60, clipEndSeconds: 138 },
    { clipStartSeconds: 138, clipEndSeconds: 216 },
    { clipStartSeconds: 216, clipEndSeconds: 684 },
  ]);
});

test("the last day's clip ends with the video when the transcript runs past it", () => {
  const input = generationInput(1);
  input.sermon.durationSeconds = 300;
  assert.deepEqual(dayClips(mapOutline(outlineOutput(1), input), input), [{ clipStartSeconds: 60, clipEndSeconds: 300 }]);
});

test("a day none of whose points has a time has no clip", () => {
  const input = generationInput(2);
  const raw = outlineOutput(2);
  raw.points[1]!.evidenceBlocks = ["b999"];
  const outline = mapOutline(raw, input);
  outline.days[1]!.pointIds = ["p2"];
  assert.deepEqual(dayClips(outline, input)[1], { clipStartSeconds: null, clipEndSeconds: null });
});

test("a transcript without timing gives no clips", () => {
  const input = generationInput(1);
  input.transcriptSegments = input.transcriptSegments!.map((segment) => ({ ...segment, startMs: 0, endMs: null }));
  assert.deepEqual(dayClips(mapOutline(outlineOutput(1), input), input), [{ clipStartSeconds: null, clipEndSeconds: null }]);
});
