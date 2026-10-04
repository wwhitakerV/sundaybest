import { createContext, useContext, useMemo, type ReactNode } from "react";
import { isRunningInExpoGo } from "expo";

import { env } from "../config/env";
import { flags } from "../config/flags";
import { createAppAttestation } from "../security/attestation/app-attest";
import type { AppAttestDevice, Attestation } from "../security/attestation/attestation";
import { createIntegrityState } from "../security/integrity/policy";
import { createExpoSecureStorage } from "../security/secure-storage/expo-secure-storage";
import { createDevelopmentSessionManager } from "../security/session/development-session";
import { createSessionManager, type SessionManager } from "../security/session/session";
import { createBootstrapApi } from "./bootstrap-api";
import { createApiClient } from "./client";
import { resolveApiBaseUrl } from "./resolve-api-url";
import { createSundayBestApi } from "./sundaybest-api";

export type SundayBestApi = ReturnType<typeof createSundayBestApi>;

export type ApiRuntime = {
  api: SundayBestApi;
  session: SessionManager;
  baseUrl: string;
  authMode: "development" | "attested";
};

const ApiRuntimeContext = createContext<ApiRuntime | null>(null);

export function ApiProvider({ children }: { children: ReactNode }) {
  const runtime = useMemo(createRuntime, []);
  return <ApiRuntimeContext.Provider value={runtime}>{children}</ApiRuntimeContext.Provider>;
}

export function useApiRuntime(): ApiRuntime {
  const runtime = useContext(ApiRuntimeContext);
  if (!runtime) throw new Error("useApiRuntime must be used inside ApiProvider");
  return runtime;
}

export function useSundayBestApi(): SundayBestApi {
  return useApiRuntime().api;
}

function createRuntime(): ApiRuntime {
  const development = env.variant === "development";
  const baseUrl = resolveApiBaseUrl(env.apiUrl, development);
  const secureStorage = createExpoSecureStorage();
  const bootstrapApi = createBootstrapApi({ baseUrl });
  const integrity = createIntegrityState();
  const devAuth = development && (isRunningInExpoGo() || !flags.isEnabled("attestation"));

  const attestation: Attestation = devAuth
    ? disabledAttestation
    : createAppAttestation({
        api: bootstrapApi,
        device: lazyExpoAppAttestDevice,
        secureStorage,
        enabled: flags.isEnabled("attestation"),
      });

  const session = devAuth
    ? createDevelopmentSessionManager({ api: bootstrapApi, secureStorage })
    : createSessionManager({ api: bootstrapApi, attestation, secureStorage });

  const client = createApiClient({
    baseUrl,
    session,
    attestation,
    integrity,
    allowUnsignedSensitive: devAuth,
  });

  return {
    api: createSundayBestApi(client),
    session,
    baseUrl,
    authMode: devAuth ? "development" : "attested",
  };
}

const disabledAttestation: Attestation = {
  async attest() {
    return { status: "disabled" };
  },
  async createAssertion() {
    return { status: "disabled" };
  },
  async reset() {
    return Promise.resolve();
  },
};


declare const require: (path: string) => { expoAppAttestDevice: AppAttestDevice };

/** Do not load @expo/app-integrity at all while running inside Expo Go. */
const lazyExpoAppAttestDevice: AppAttestDevice = {
  support() {
    return loadRealDevice().support();
  },
  generateKey() {
    return loadRealDevice().generateKey();
  },
  attestKey(keyId, challenge) {
    return loadRealDevice().attestKey(keyId, challenge);
  },
  createAssertion(keyId, challenge) {
    return loadRealDevice().createAssertion(keyId, challenge);
  },
};

function loadRealDevice(): AppAttestDevice {
  return require("../security/attestation/expo-app-attest-device").expoAppAttestDevice;
}
