import assert from "node:assert/strict";
import test from "node:test";

import { parseYouTubeVideoId } from "../src/providers/youtube.js";

test("parses supported YouTube URL shapes", () => {
  assert.equal(parseYouTubeVideoId("https://www.youtube.com/watch?v=5fVA7C24eI4"), "5fVA7C24eI4");
  assert.equal(parseYouTubeVideoId("https://youtu.be/5fVA7C24eI4"), "5fVA7C24eI4");
  assert.equal(parseYouTubeVideoId("https://youtube.com/live/5fVA7C24eI4"), "5fVA7C24eI4");
  assert.equal(parseYouTubeVideoId("https://youtube.com/shorts/5fVA7C24eI4"), "5fVA7C24eI4");
});

test("rejects non-YouTube URLs", () => {
  assert.equal(parseYouTubeVideoId("https://vimeo.com/123456"), null);
  assert.equal(parseYouTubeVideoId("not-a-url"), null);
});
