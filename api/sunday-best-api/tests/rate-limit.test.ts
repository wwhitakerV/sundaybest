import assert from "node:assert/strict";
import test from "node:test";

import Fastify from "fastify";

import { registerRateLimit, type RateLimitConfig } from "../src/http/rate-limit.js";

const config: RateLimitConfig = {
  RATE_LIMIT_WINDOW_MS: 60_000,
  RATE_LIMIT_DEFAULT_MAX: 2,
  RATE_LIMIT_AUTH_MAX: 1,
  RATE_LIMIT_SEARCH_MAX: 2,
  RATE_LIMIT_GENERATION_MAX: 1,
};

test("rate limiter blocks requests after the bucket limit", async () => {
  const app = Fastify({ disableRequestLogging: true });
  registerRateLimit(app, config);
  app.get("/v1/example", async () => ({ ok: true }));

  assert.equal((await app.inject({ method: "GET", url: "/v1/example" })).statusCode, 200);
  assert.equal((await app.inject({ method: "GET", url: "/v1/example" })).statusCode, 200);

  const blocked = await app.inject({ method: "GET", url: "/v1/example" });
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.headers["retry-after"] !== undefined, true);
  assert.equal(blocked.json().error.code, "RATE_LIMITED");

  await app.close();
});

test("auth routes use their stricter bucket and health checks are exempt", async () => {
  const app = Fastify({ disableRequestLogging: true });
  registerRateLimit(app, config);
  app.post("/v1/attest/challenge", async () => ({ ok: true }));
  app.get("/health/live", async () => ({ status: "ok" }));

  assert.equal((await app.inject({ method: "POST", url: "/v1/attest/challenge" })).statusCode, 200);
  assert.equal((await app.inject({ method: "POST", url: "/v1/attest/challenge" })).statusCode, 429);

  for (let index = 0; index < 5; index += 1) {
    assert.equal((await app.inject({ method: "GET", url: "/health/live" })).statusCode, 200);
  }

  await app.close();
});
