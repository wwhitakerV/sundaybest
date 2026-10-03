import assert from "node:assert/strict";
import test from "node:test";

import { buildRequestAssertionPayload } from "../src/auth/request-binding.js";

test("request assertion payload is stable across object key order", () => {
  const a = buildRequestAssertionPayload("challenge", "post", "/v1/plans", {
    sermonId: "abc",
    lengthDays: 5,
    nested: { b: 2, a: 1 },
  });
  const b = buildRequestAssertionPayload("challenge", "POST", "/v1/plans", {
    nested: { a: 1, b: 2 },
    lengthDays: 5,
    sermonId: "abc",
  });
  assert.equal(a, b);
});

test("request assertion payload changes when request changes", () => {
  const base = buildRequestAssertionPayload("challenge", "DELETE", "/v1/me", undefined);
  const otherPath = buildRequestAssertionPayload("challenge", "DELETE", "/v1/plans/123", undefined);
  assert.notEqual(base, otherPath);
});
