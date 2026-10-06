import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../src/http/errors.js";
import { isRetryableGenerationFailure } from "../src/worker/generation-worker.js";

test("missing captions and unavailable sermons are not retried automatically", () => {
  assert.equal(isRetryableGenerationFailure(new AppError("TRANSCRIPT_UNAVAILABLE")), false);
  assert.equal(isRetryableGenerationFailure(new AppError("SERMON_UNAVAILABLE")), false);
  assert.equal(isRetryableGenerationFailure(new AppError("SERMON_UNSUPPORTED")), false);
});

test("provider configuration failures are not retried automatically", () => {
  assert.equal(isRetryableGenerationFailure(new AppError("INTERNAL", "Set OPENAI_API_KEY", { permanent: true })), false);
});

test("provider outages and invalid model output are retried", () => {
  assert.equal(isRetryableGenerationFailure(new AppError("INTERNAL", "OpenAI generation failed with HTTP 503")), true);
  assert.equal(isRetryableGenerationFailure(new AppError("INTERNAL", "OpenAI returned invalid plan content")), true);
  assert.equal(isRetryableGenerationFailure(new Error("socket hang up")), true);
});
