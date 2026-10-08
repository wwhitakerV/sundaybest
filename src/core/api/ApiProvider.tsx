import Constants from "expo-constants";
import { isRunningInExpoGo } from "expo";
import { createContext, useContext, useState, type ReactNode } from "react";

import { env } from "../config/env";
import { flags } from "../config/flags";
import { logger } from "../monitoring/logger";
import { createAppAttestation } from "../security/attestation/app-attest";
import type { AppAttestDevice, Attestation } from "../security/attestation/attestation";
import {
  shouldMonitorIntegrity,
  useIntegrityMonitor,
} from "../security/integrity/freerasp-integrity";
import { createIntegrityState, type IntegrityState } from "../security/integrity/policy";
import { createExpoSecureStorage } from "../security/secure-storage/expo-secure-storage";
import { createDevelopmentSessionManager } from "../security/session/development-session";
import { createSessionManager } from "../security/session/session";
import type { SessionManager } from "../security/session/session-types";
import { createBootstrapApi } from "./bootstrap-api";
import { createApiClient } from "./client";
import { resolveApiBaseUrl } from "./resolve-api-url";
import { createSundayBestApi } from "./sundaybest-api";

export type SundayBestApi = ReturnType<typeof createSundayBestApi>;

type ApiRuntime = {
  api: SundayBestApi;
  session: SessionManager;
  integrity: IntegrityState;
  baseUrl: string;
  authMode: "development" | "attested";
};

const ApiRuntimeContext = createContext<ApiRuntime | null>(null);

export function ApiProvider({ children }: { children: ReactNode }) {
  // Created once for the life of the provider.
  const [runtime] = useState(createRuntime);

  return (
    <ApiRuntimeContext.Provider value={runtime}>
      {shouldMonitorIntegrity(env.variant) && !isRunningInExpoGo() ? (
        <IntegrityMonitor runtime={runtime}>{children}</IntegrityMonitor>
      ) : (
        children
      )}
    </ApiRuntimeContext.Provider>
  );
}

function useApiRuntime(): ApiRuntime {
  const runtime = useContext(ApiRuntimeContext);

  if (!runtime) {
    throw new Error("useApiRuntime must be used inside ApiProvider");
  }

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
    ? createDevelopmentSessionManager({
        api: bootstrapApi,
        secureStorage,
      })
    : createSessionManager({
        api: bootstrapApi,
        attestation,
        secureStorage,
      });

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
    integrity,
    baseUrl,
    authMode: devAuth ? "development" : "attested",
  };
}

function IntegrityMonitor({ runtime, children }: { runtime: ApiRuntime; children: ReactNode }) {
  const config = getIntegrityConfig();

  useIntegrityMonitor({
    variant: env.variant,
    bundleId: config.bundleId,
    appTeamId: config.appTeamId,
    watcherMail: config.watcherMail,
    integrity: runtime.integrity,

    onSessionCompromised: () => {
      void runtime.session.clear();
    },

    onSignal: (signal, response) => {
      // Signal names only. Never attach device identifiers or SDK payloads.
      logger.warn("device integrity signal", {
        signal,
        response,
      });
    },
  });

  return children;
}

function getIntegrityConfig(): {
  bundleId: string;
  appTeamId: string;
  watcherMail: string;
} {
  const bundleId = Constants.expoConfig?.ios?.bundleIdentifier;

  if (!bundleId) {
    throw new Error("Missing iOS bundle identifier for runtime integrity monitoring");
  }

  if (!env.appTeamId) {
    throw new Error("Missing Apple Team ID for runtime integrity monitoring");
  }

  if (!env.securityWatcherEmail) {
    throw new Error("Missing security watcher email for runtime integrity monitoring");
  }

  return {
    bundleId,
    appTeamId: env.appTeamId,
    watcherMail: env.securityWatcherEmail,
  };
}

const disabledAttestation: Attestation = {
  attest: () => Promise.resolve({ status: "disabled" }),

  createAssertion: () => Promise.resolve({ status: "disabled" }),

  reset: () => Promise.resolve(),
};

declare const require: (path: string) => {
  expoAppAttestDevice: AppAttestDevice;
};

/**
 * Do not load @expo/app-integrity at all while running inside Expo Go.
 */
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
