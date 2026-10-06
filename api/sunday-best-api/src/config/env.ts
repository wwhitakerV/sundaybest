import { z } from "zod";

const booleanFromString = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.url().optional(),
);
const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(1).optional(),
);

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    HOST: z.string().default("0.0.0.0"),
    PORT: z.coerce.number().int().min(1).max(65535).default(4100),
    DATABASE_URL: z.string().min(1),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),

    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1_000).max(3_600_000).default(60_000),
    RATE_LIMIT_DEFAULT_MAX: z.coerce.number().int().min(1).max(100_000).default(240),
    RATE_LIMIT_AUTH_MAX: z.coerce.number().int().min(1).max(10_000).default(30),
    RATE_LIMIT_SEARCH_MAX: z.coerce.number().int().min(1).max(10_000).default(60),
    RATE_LIMIT_GENERATION_MAX: z.coerce.number().int().min(1).max(10_000).default(12),

    JWT_SECRET: z.string().min(32),
    JWT_ISSUER: z.string().min(1).default("sundaybest-api"),
    JWT_AUDIENCE: z.string().min(1).default("sundaybest-mobile"),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),

    APP_ATTEST_TEAM_ID: z.string().min(1),
    APP_ATTEST_BUNDLE_ID: z.string().min(1),
    APP_ATTEST_ALLOW_DEVELOPMENT: booleanFromString.default(false),
    DEV_SESSION_ENABLED: booleanFromString.default(false),

    SUPADATA_API_KEY: optionalString,
    SUPADATA_BASE_URL: z.url().default("https://api.supadata.ai/v1"),
    SUPADATA_TRANSCRIPT_POLL_MS: z.coerce.number().int().min(500).max(10_000).default(1500),
    SUPADATA_TRANSCRIPT_POLL_TIMEOUT_MS: z.coerce.number().int().min(10_000).max(600_000).default(180_000),

    TRANSCRIPT_PROVIDER_URL: optionalUrl,
    TRANSCRIPT_PROVIDER_TOKEN: optionalString,
    PLAN_GENERATION_PROVIDER_URL: optionalUrl,
    PLAN_GENERATION_PROVIDER_TOKEN: optionalString,
    BIBLE_PROVIDER_URL: optionalUrl,
    BIBLE_PROVIDER_TOKEN: optionalString,

    WORKER_POLL_MS: z.coerce.number().int().min(250).max(60_000).default(1000),
    WORKER_LOCK_SECONDS: z.coerce.number().int().min(10).max(3600).default(120),
    WORKER_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(3),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === "production" && value.DEV_SESSION_ENABLED) {
      ctx.addIssue({
        code: "custom",
        path: ["DEV_SESSION_ENABLED"],
        message: "DEV_SESSION_ENABLED must be false in production",
      });
    }
    if (value.NODE_ENV === "production" && value.APP_ATTEST_ALLOW_DEVELOPMENT) {
      ctx.addIssue({
        code: "custom",
        path: ["APP_ATTEST_ALLOW_DEVELOPMENT"],
        message: "Development App Attest certificates must not be accepted in production",
      });
    }
    if (value.NODE_ENV === "production" && !value.SUPADATA_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["SUPADATA_API_KEY"],
        message: "Required in production for YouTube search, metadata, and transcript ingestion",
      });
    }
    if (value.NODE_ENV === "production" && !value.PLAN_GENERATION_PROVIDER_URL) {
      ctx.addIssue({ code: "custom", path: ["PLAN_GENERATION_PROVIDER_URL"], message: "Required in production" });
    }
    if (value.NODE_ENV === "production" && !value.BIBLE_PROVIDER_URL) {
      ctx.addIssue({ code: "custom", path: ["BIBLE_PROVIDER_URL"], message: "Required in production" });
    }
    if (value.NODE_ENV === "production") {
      const secureUrls = [
        ["SUPADATA_BASE_URL", value.SUPADATA_BASE_URL],
        ["TRANSCRIPT_PROVIDER_URL", value.TRANSCRIPT_PROVIDER_URL],
        ["PLAN_GENERATION_PROVIDER_URL", value.PLAN_GENERATION_PROVIDER_URL],
        ["BIBLE_PROVIDER_URL", value.BIBLE_PROVIDER_URL],
      ] as const;

      for (const [field, url] of secureUrls) {
        if (url && !url.startsWith("https://")) {
          ctx.addIssue({
            code: "custom",
            path: [field],
            message: "HTTPS is required in production",
          });
        }
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export function parseEnv(input: NodeJS.ProcessEnv): Env {
  const parsed = envSchema.safeParse(input);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid API environment: ${detail}`);
  }
  return parsed.data;
}

export const env = parseEnv(process.env);
