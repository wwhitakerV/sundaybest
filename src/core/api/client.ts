import type { z } from "zod";

import type { Attestation } from "../security/attestation/attestation";
import type { IntegrityState } from "../security/integrity/policy";
import type { SessionManager } from "../security/session/session";
import { ApiError } from "./api-error";
import { apiErrorEnvelopeSchema, type ApiErrorCode } from "./contracts/attestation";

/**
 * The app's HTTP client.
 *
 * Every response is parsed, every failure is typed, and nothing retries unless
 * retrying is safe. It sits on the global `fetch`, which is **React Native's**
 * fetch rather than Expo's — see ADR 0006: TLS pinning cannot see `expo/fetch`,
 * so `EXPO_PUBLIC_USE_RN_FETCH=1` is required and validated by the env schema.
 */

type HttpMethod = "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Methods safe to repeat. Anything else must opt in per request. */
const IDEMPOTENT_METHODS: ReadonlySet<HttpMethod> = new Set<HttpMethod>(["GET", "HEAD"]);

const DEFAULT_TIMEOUT_MS = 15_000;

/** One retry, after a short pause. Long enough to clear a blip, short enough to not feel stuck. */
const RETRY_DELAY_MS = 400;

export interface ApiClientDeps {
  baseUrl: string;
  session: SessionManager;
  attestation: Attestation;
  integrity: IntegrityState;
  /** Injected for tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
  /** Injected so backoff is tested without fake timers. */
  sleep?: (ms: number) => Promise<void>;
}

interface RequestOptions<T> {
  path: string;
  method?: HttpMethod;
  body?: unknown;
  /** Every response is parsed. There is no unparsed escape hatch on purpose. */
  schema: z.ZodType<T>;
  /** Attaches a fresh assertion, and is refused if integrity disallows it. */
  sensitive?: boolean;
  /** Allows the one retry for a method that is not idempotent by default. */
  idempotent?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface ApiClient {
  request<T>(options: RequestOptions<T>): Promise<T>;
}

export function createApiClient({
  baseUrl,
  session,
  attestation,
  integrity,
  fetchImpl = fetch,
  sleep = defaultSleep,
}: ApiClientDeps): ApiClient {
  async function attempt<T>(options: RequestOptions<T>): Promise<T> {
    const method = options.method ?? "GET";

    // Refused before it leaves the device. Checked first so a compromised
    // device does not even mint an assertion.
    if (options.sensitive === true && !integrity.isSensitiveAllowed()) {
      throw new ApiError("INTERNAL", undefined, { kind: "integrity" });
    }

    const headers = new Headers({ Accept: "application/json" });

    const token = await session.getAccessToken();
    if (token.status !== "ok") throw sessionFailureToApiError(token);
    headers.set("Authorization", `Bearer ${token.accessToken}`);

    if (options.sensitive === true) {
      const assertion = await attestation.createAssertion();
      if (assertion.status !== "ok") throw assertionFailureToApiError(assertion);

      // Headers, not the body, so any method can carry them. Documented in
      // docs/api/attestation.md — a header the contract does not name is a
      // header the server will not check.
      headers.set("X-Attestation-KeyId", assertion.keyId);
      headers.set("X-Attestation-Assertion", assertion.assertion);
      headers.set("X-Attestation-Challenge", assertion.challenge);
    }

    const hasBody = options.body !== undefined && method !== "GET" && method !== "HEAD";
    if (hasBody) headers.set("Content-Type", "application/json");

    const timeoutSignal = AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    const signal =
      options.signal === undefined
        ? timeoutSignal
        : AbortSignal.any([timeoutSignal, options.signal]);

    let response: Response;
    try {
      response = await fetchImpl(join(baseUrl, options.path), {
        method,
        headers,
        ...(hasBody ? { body: JSON.stringify(options.body) } : {}),
        signal,
      });
    } catch (cause) {
      // An abort is our own deadline, not a broken network, and the two want
      // different handling upstream.
      const aborted = cause instanceof Error && cause.name === "AbortError";
      throw new ApiError("INTERNAL", undefined, {
        kind: aborted ? "timeout" : "network",
        cause,
      });
    }

    if (!response.ok) throw await responseToApiError(response);

    return parseBody(response, options.schema);
  }

  return {
    async request<T>(options: RequestOptions<T>): Promise<T> {
      const method = options.method ?? "GET";
      const retryAllowed = options.idempotent ?? IDEMPOTENT_METHODS.has(method);

      try {
        return await attempt(options);
      } catch (cause) {
        const error = cause instanceof ApiError ? cause : undefined;

        // Retrying a non-idempotent request after a timeout is how one request
        // becomes two of whatever it created — the client cannot tell whether
        // the server processed the first one.
        if (error === undefined || !error.retryable || !retryAllowed) throw cause;

        await sleep(RETRY_DELAY_MS);

        return attempt(options);
      }
    },
  };
}

/**
 * Reads an error response.
 *
 * The documented envelope is tried first; anything else — an HTML error page
 * from a proxy, an empty body — degrades to `INTERNAL` rather than throwing on
 * top of whatever already failed.
 */
async function responseToApiError(response: Response): Promise<ApiError> {
  let code: ApiErrorCode = "INTERNAL";
  let serverMessage: string | undefined;

  try {
    const parsed = apiErrorEnvelopeSchema.safeParse(await response.json());
    if (parsed.success) {
      code = parsed.data.error.code;
      serverMessage = parsed.data.error.message;
    }
  } catch {
    // Not JSON. The status is still meaningful.
  }

  return new ApiError(code, response.status, {
    ...(serverMessage === undefined ? {} : { serverMessage }),
  });
}

/**
 * Parses a success body.
 *
 * A 2xx whose body fails its own contract is a failure: passing a
 * partially-understood payload into the app is exactly the `as`-on-untrusted-data
 * pattern the security rules forbid. The body never reaches the error message,
 * because a body that surprised us is the last thing to put in a log.
 */
async function parseBody<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await response.json();
  } catch (cause) {
    throw new ApiError("INTERNAL", response.status, { kind: "schema", cause });
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError("INTERNAL", response.status, { kind: "schema" });
  }

  return parsed.data;
}

type SessionFailure = Exclude<
  Awaited<ReturnType<SessionManager["getAccessToken"]>>,
  { status: "ok" }
>;

function sessionFailureToApiError(failure: SessionFailure): ApiError {
  switch (failure.status) {
    case "needs-attestation":
      return new ApiError("REFRESH_TOKEN_INVALID", 401);
    case "unavailable":
      // Attestation cannot run here at all, so there will never be a token.
      // Not retryable — a retry would be a loop with no exit.
      return new ApiError("ATTESTATION_INVALID", 401);
    case "transient":
      return new ApiError(failure.code === "DEVICE_ERROR" ? "INTERNAL" : failure.code, undefined);
    case "rejected":
      return new ApiError(failure.code === "DEVICE_ERROR" ? "INTERNAL" : failure.code, 403);
  }
}

type AssertionFailure = Exclude<
  Awaited<ReturnType<Attestation["createAssertion"]>>,
  { status: "ok" }
>;

function assertionFailureToApiError(failure: AssertionFailure): ApiError {
  switch (failure.status) {
    case "needs-attestation":
      return new ApiError("KEY_UNKNOWN", 404);
    case "disabled":
    case "unsupported":
      // The request needs an assertion this device will never produce. Fail
      // closed rather than sending it unsigned and letting the server decide.
      return new ApiError("ATTESTATION_INVALID", undefined, { kind: "integrity" });
    case "transient":
      return new ApiError(failure.code === "DEVICE_ERROR" ? "INTERNAL" : failure.code, undefined);
    case "rejected":
      return new ApiError(failure.code === "DEVICE_ERROR" ? "INTERNAL" : failure.code, 403);
  }
}

function join(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
