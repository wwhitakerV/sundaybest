import type { z } from "zod";

import type { Attestation } from "../security/attestation/attestation";
import type { IntegrityState } from "../security/integrity/policy";
import type { SessionManager } from "../security/session/session-types";
import { ApiError } from "./api-error";
import {
  assertionFailureToApiError,
  parseBody,
  responseToApiError,
  sessionFailureToApiError,
} from "./client-errors";
import { getDeviceTimeZone } from "../time/device-timezone";

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
  /** Development-only: the local API accepts dev installations without App Attest. */
  allowUnsignedSensitive?: boolean;
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
  /** Stable per logical mutation. The server uses it to collapse duplicate creates/writes. */
  idempotencyKey?: string;
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
  allowUnsignedSensitive = false,
}: ApiClientDeps): ApiClient {
  async function attempt<T>(options: RequestOptions<T>): Promise<T> {
    const method = options.method ?? "GET";

    // Refused before it leaves the device. Checked first so a compromised
    // device does not even mint an assertion.
    if (options.sensitive === true && !allowUnsignedSensitive && !integrity.isSensitiveAllowed()) {
      throw new ApiError("INTERNAL", undefined, { kind: "integrity" });
    }

    const headers = new Headers({
      Accept: "application/json",
      "X-Client-Timezone": getDeviceTimeZone(),
    });

    if (options.idempotencyKey) headers.set("Idempotency-Key", options.idempotencyKey);

    const token = await session.getAccessToken();
    if (token.status !== "ok") throw sessionFailureToApiError(token);
    headers.set("Authorization", `Bearer ${token.accessToken}`);

    if (options.sensitive === true && !allowUnsignedSensitive) {
      const assertion = await attestation.createAssertion({
        method,
        path: options.path,
        body: options.body,
      });
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

function join(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
