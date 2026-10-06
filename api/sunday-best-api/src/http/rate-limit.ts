import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import type { Env } from "../config/env.js";

type BucketKind = "auth" | "search" | "generation" | "default";

export type RateLimitConfig = Pick<
  Env,
  | "RATE_LIMIT_WINDOW_MS"
  | "RATE_LIMIT_DEFAULT_MAX"
  | "RATE_LIMIT_AUTH_MAX"
  | "RATE_LIMIT_SEARCH_MAX"
  | "RATE_LIMIT_GENERATION_MAX"
>;

type Counter = {
  count: number;
  resetAt: number;
};

const SWEEP_EVERY = 500;
const MAX_COUNTERS = 50_000;

/**
 * Small in-process fixed-window rate limiter used as a safety backstop.
 *
 * This is deliberately not presented as the primary production perimeter: a
 * multi-instance deployment still needs edge/WAF limits. It exists so a bad
 * proxy rule or a directly-reachable app instance is not completely unguarded.
 * The key is request.ip, which is only trustworthy when TRUST_PROXY_HOPS is set
 * to the exact number of proxies in front of Fastify.
 */
export function registerRateLimit(app: FastifyInstance, env: RateLimitConfig): void {
  const counters = new Map<string, Counter>();
  let requestCount = 0;

  app.addHook("onRequest", async (request, reply) => {
    if (request.method === "OPTIONS" || isHealthOrDocs(request)) return;

    const bucket = bucketFor(request);
    const limit = limitFor(bucket, env);
    if (limit <= 0) return;

    const now = Date.now();
    const windowMs = env.RATE_LIMIT_WINDOW_MS;
    const key = `${bucket}:${request.ip}`;
    const current = counters.get(key);

    let next: Counter;
    if (!current || current.resetAt <= now) {
      if (!current && counters.size >= MAX_COUNTERS) {
        sweepExpired(counters, now);
        if (counters.size >= MAX_COUNTERS) evictOldest(counters);
      }
      next = { count: 1, resetAt: now + windowMs };
      counters.set(key, next);
    } else {
      current.count += 1;
      next = current;
    }

    setRateLimitHeaders(reply, limit, Math.max(0, limit - next.count), next.resetAt);

    requestCount += 1;
    if (requestCount % SWEEP_EVERY === 0) sweepExpired(counters, now);

    if (next.count <= limit) return;

    const retryAfterSeconds = Math.max(1, Math.ceil((next.resetAt - now) / 1000));
    reply.header("Retry-After", String(retryAfterSeconds));
    await reply.code(429).send({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again shortly.",
        requestId: request.id,
      },
    });
  });

  app.addHook("onClose", async () => {
    counters.clear();
  });
}

function bucketFor(request: FastifyRequest): BucketKind {
  const route = request.routeOptions.url;

  if (
    route === "/v1/attest/challenge" ||
    route === "/v1/attest/verify" ||
    route === "/v1/session/bootstrap" ||
    route === "/v1/session/refresh" ||
    route === "/v1/dev/session"
  ) {
    return "auth";
  }

  if (route === "/v1/sermons/search" || route === "/v1/sermons/resolve") {
    return "search";
  }

  if (
    (request.method === "POST" && route === "/v1/plans") ||
    route === "/v1/plan-generations/:generationId/retry"
  ) {
    return "generation";
  }

  return "default";
}

function limitFor(bucket: BucketKind, env: RateLimitConfig): number {
  switch (bucket) {
    case "auth":
      return env.RATE_LIMIT_AUTH_MAX;
    case "search":
      return env.RATE_LIMIT_SEARCH_MAX;
    case "generation":
      return env.RATE_LIMIT_GENERATION_MAX;
    case "default":
      return env.RATE_LIMIT_DEFAULT_MAX;
  }
}

function isHealthOrDocs(request: FastifyRequest): boolean {
  const route = request.routeOptions.url;
  return (
    route === "/health/live" ||
    route === "/health/ready" ||
    route === "/docs" ||
    route === "/openapi.json"
  );
}

function setRateLimitHeaders(
  reply: FastifyReply,
  limit: number,
  remaining: number,
  resetAt: number,
): void {
  reply.header("X-RateLimit-Limit", String(limit));
  reply.header("X-RateLimit-Remaining", String(remaining));
  reply.header("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));
}

function sweepExpired(counters: Map<string, Counter>, now: number): void {
  for (const [key, counter] of counters) {
    if (counter.resetAt <= now) counters.delete(key);
  }
}

function evictOldest(counters: Map<string, Counter>): void {
  const oldest = counters.keys().next();
  if (!oldest.done) counters.delete(oldest.value);
}
