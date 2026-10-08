import * as Crypto from "expo-crypto";

import { sessionCredentialsSchema, type SessionCredentials } from "../../api/contracts/attestation";
import type { SecureStorage } from "../secure-storage/secure-storage";
import type { SessionManager, SessionResult } from "./session-types";
import { getDeviceTimeZone } from "../../time/device-timezone";

const INSTALLATION_KEY = "development.installationId";
const EXPIRY_SKEW_MS = 60_000;

export interface DevelopmentSessionApi {
  createDevelopmentSession(input: {
    installationId: string;
    timezone: string;
  }): Promise<SessionCredentials>;
}

export interface DevelopmentSessionDeps {
  api: DevelopmentSessionApi;
  secureStorage: SecureStorage;
  now?: () => number;
  skewMs?: number;
}

/**
 * Expo Go cannot mint App Attest assertions. In development only, this manager
 * asks the API for a dev credential tied to one stable, keychain-backed install
 * id. Reissuing credentials therefore returns to the same anonymous user rather
 * than manufacturing a new user every app reload.
 */
export function createDevelopmentSessionManager({
  api,
  secureStorage,
  now = Date.now,
  skewMs = EXPIRY_SKEW_MS,
}: DevelopmentSessionDeps): SessionManager {
  let active: { accessToken: string; expiresAtMs: number } | null = null;
  let inFlight: Promise<SessionResult> | null = null;

  function isUsable(): boolean {
    return active !== null && active.expiresAtMs - skewMs > now();
  }

  async function installationId(): Promise<string> {
    const stored = await secureStorage.get(INSTALLATION_KEY);
    if (stored) return stored;

    const created = Crypto.randomUUID();
    await secureStorage.set(INSTALLATION_KEY, created);
    return created;
  }

  async function issue() {
    try {
      const credentials = sessionCredentialsSchema.parse(
        await api.createDevelopmentSession({
          installationId: await installationId(),
          timezone: getDeviceTimeZone(),
        }),
      );

      active = {
        accessToken: credentials.accessToken,
        expiresAtMs: now() + credentials.expiresIn * 1000,
      };

      return { status: "ok" as const, accessToken: credentials.accessToken };
    } catch {
      return { status: "transient" as const, code: "INTERNAL" as const };
    }
  }

  return {
    async getAccessToken() {
      if (isUsable() && active) return { status: "ok", accessToken: active.accessToken };

      inFlight ??= issue().finally(() => {
        inFlight = null;
      });
      return inFlight;
    },

    adopt(credentials) {
      active = {
        accessToken: credentials.accessToken,
        expiresAtMs: now() + credentials.expiresIn * 1000,
      };
      return Promise.resolve();
    },

    clear() {
      active = null;
      inFlight = null;
      return Promise.resolve();
    },
  };
}
