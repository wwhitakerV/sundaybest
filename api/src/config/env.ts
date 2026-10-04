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

    JWT_SECRET: z.string().min(32),
    JWT_ISSUER: z.string().min(1).default("sundaybest-api"),
    JWT_AUDIENCE: z.string().min(1).default("sundaybest-mobile"),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),

    APP_ATTEST_TEAM_ID: z.string().min(1),
    APP_ATTEST_BUNDLE_ID: z.string().min(1),
    APP_ATTEST_ALLOW_DEVELOPMENT: booleanFromString.default(false),
    DEV_SESSION_ENABLED: booleanFromString.default(false),

    TRANSCRIPT_PROVIDER_URL: optionalUrl,
    TRANSCRIPT_PROVIDER_TOKEN: optionalString,
    PLAN_GENERATION_PROVIDER_URL: optionalUrl,
    PLAN_GENERATION_PROVIDER_TOKEN: optionalString,
    BIBLE_PROVIDER_URL: optionalUrl,
    BIBLE_PROVIDER_TOKEN: optionalString,

    YOUTUBE_OEMBED_BASE_URL: z.url().default("https://www.youtube.com/oembed"),
    YOUTUBE_SEARCH_BASE_URL: z.url().default("https://www.googleapis.com/youtube/v3/search"),
    YOUTUBE_API_KEY: optionalString,
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
    if (value.NODE_ENV === "production" && !value.TRANSCRIPT_PROVIDER_URL) {
      ctx.addIssue({ code: "custom", path: ["TRANSCRIPT_PROVIDER_URL"], message: "Required in production" });
    }
    if (value.NODE_ENV === "production" && !value.PLAN_GENERATION_PROVIDER_URL) {
      ctx.addIssue({ code: "custom", path: ["PLAN_GENERATION_PROVIDER_URL"], message: "Required in production" });
    }
    if (value.NODE_ENV === "production" && !value.BIBLE_PROVIDER_URL) {
      ctx.addIssue({ code: "custom", path: ["BIBLE_PROVIDER_URL"], message: "Required in production" });
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
