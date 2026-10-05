import Fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";

import type { AppContext } from "./app-context.js";
import { registerApiDocs } from "./docs/openapi.js";
import { AppError, isAppError } from "./http/errors.js";
import { registerV1Routes } from "./routes/v1.js";
import { registerRateLimit } from "./http/rate-limit.js";

export async function buildApp(context: AppContext): Promise<FastifyInstance> {
  const app = Fastify({
    trustProxy: context.env.TRUST_PROXY_HOPS === 0 ? false : context.env.TRUST_PROXY_HOPS,
    disableRequestLogging: true,
    logger: {
      level: context.env.NODE_ENV === "development" ? "debug" : "info",
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.x-attestation-assertion",
          "req.headers.x-attestation-challenge",
          "req.body.refreshToken",
          "req.body.attestation",
          "req.body.assertion",
          "res.headers.set-cookie",
        ],
        censor: "[REDACTED]",
      },
    },
    bodyLimit: 256 * 1024,
    requestTimeout: 30_000,
  });

  if (context.env.NODE_ENV !== "production") {
    await registerApiDocs(app);
  }

  registerRateLimit(app, context.env);

  // Never log raw URLs here: sermon search terms live in the query string.
  // Route templates preserve operational value without recording user text.
  app.addHook("onResponse", async (request, reply) => {
    request.log.info(
      {
        method: request.method,
        route: request.routeOptions.url,
        statusCode: reply.statusCode,
        responseTimeMs: Math.round(reply.elapsedTime),
      },
      "request completed",
    );
  });

  app.addHook("onSend", async (request, reply, payload) => {
    reply.header("X-Content-Type-Options", "nosniff");
    if (request.url.startsWith("/v1/")) {
      reply.header("Cache-Control", "no-store");
    }
    return payload;
  });

  app.get("/health/live", async () => ({ status: "ok" as const }));
  app.get("/health/ready", async (_request, reply) => {
    try {
      await context.database.sql`select 1`;
      return { status: "ready" as const };
    } catch {
      return reply.code(503).send({ status: "not-ready" });
    }
  });

  await registerV1Routes(app, context);

  app.setNotFoundHandler((request, reply) => {
    void reply.code(404).send({
      error: { code: "NOT_FOUND", message: "Route not found", requestId: request.id },
    });
  });

  app.setErrorHandler((error, request, reply) => {
    let appError: AppError;
    if (isAppError(error)) {
      appError = error;
    } else if (error instanceof ZodError) {
      appError = new AppError("VALIDATION_FAILED", "Request or response failed validation", {
        cause: error,
      });
    } else {
      appError = new AppError("INTERNAL", "Internal server error", { cause: error });
    }

    if (appError.statusCode >= 500) {
      request.log.error({ err: error, code: appError.code }, "request failed");
    } else {
      request.log.info({ code: appError.code }, "request rejected");
    }

    const message = appError.exposeMessage ? appError.message : "Internal server error";
    void reply.code(appError.statusCode).send({
      error: { code: appError.code, message, requestId: request.id },
    });
  });

  return app;
}
