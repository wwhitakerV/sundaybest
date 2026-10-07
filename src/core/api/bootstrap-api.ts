import type { z } from "zod";

import type { AttestationApi } from "../security/attestation/attestation";
import type { SessionApi } from "../security/session/session";
import type { DevelopmentSessionApi } from "../security/session/development-session";
import { ApiError } from "./api-error";
import { getDeviceTimeZone } from "../time/device-timezone";
import {
  apiErrorEnvelopeSchema,
  bootstrapSessionRequestSchema,
  challengeRequestSchema,
  challengeResponseSchema,
  refreshRequestSchema,
  sessionCredentialsSchema,
  verifyAttestationRequestSchema,
} from "./contracts";

const DEFAULT_TIMEOUT_MS = 15_000;

export type BootstrapApi = AttestationApi & SessionApi & DevelopmentSessionApi;

export interface BootstrapApiDeps {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/**
 * Unauthenticated transport used only to establish or recover a session.
 *
 * It deliberately does not use `ApiClient`: `ApiClient` itself requires a
 * session, so routing attestation/refresh through it would create a circular
 * dependency. These four endpoints are the only pre-session network surface.
 */
export function createBootstrapApi({
  baseUrl,
  fetchImpl = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: BootstrapApiDeps): BootstrapApi {
  async function post<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
    let response: Response;
    try {
      response = await fetchImpl(join(baseUrl, path), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Client-Timezone": getDeviceTimeZone(),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (cause) {
      const aborted = cause instanceof Error && cause.name === "AbortError";
      throw new ApiError("INTERNAL", undefined, {
        kind: aborted ? "timeout" : "network",
        cause,
      });
    }

    if (!response.ok) throw await toResponseError(response);

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

  return {
    requestChallenge(keyId) {
      const body = challengeRequestSchema.parse(keyId === undefined ? {} : { keyId });
      return post("/v1/attest/challenge", body, challengeResponseSchema);
    },

    verifyAttestation(request) {
      return post(
        "/v1/attest/verify",
        verifyAttestationRequestSchema.parse(request),
        sessionCredentialsSchema,
      );
    },

    refresh(request) {
      return post(
        "/v1/session/refresh",
        refreshRequestSchema.parse(request),
        sessionCredentialsSchema,
      );
    },

    bootstrap(request) {
      return post(
        "/v1/session/bootstrap",
        bootstrapSessionRequestSchema.parse(request),
        sessionCredentialsSchema,
      );
    },

    createDevelopmentSession(input) {
      return post(
        "/v1/dev/session",
        { installationId: input.installationId, timezone: input.timezone },
        sessionCredentialsSchema,
      );
    },
  };
}

async function toResponseError(response: Response): Promise<ApiError> {
  try {
    const parsed = apiErrorEnvelopeSchema.safeParse(await response.json());
    if (parsed.success) {
      const { message } = parsed.data.error;
      return new ApiError(parsed.data.error.code, response.status, {
        ...(message !== undefined && { serverMessage: message }),
      });
    }
  } catch {
    // A non-JSON proxy/gateway response is still a failed API response.
  }

  return new ApiError("INTERNAL", response.status);
}

function join(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
