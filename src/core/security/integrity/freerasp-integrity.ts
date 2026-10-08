import type { ThreatEventActions } from "freerasp-react-native";
import type * as FreeRasp from "freerasp-react-native";

import type { Env } from "../../config/env-schema";
import {
  INTEGRITY_SIGNALS,
  type IntegrityResponse,
  type IntegrityState,
  type IntegritySignal,
} from "./policy";

/**
 * freeRASP, wired to the policy in `policy.ts`.
 *
 * IMPORTANT:
 * Do not import freerasp-react-native at module scope.
 *
 * Expo Go does not include its native module, so merely evaluating the JS
 * package crashes before our development guard can run.
 *
 * The SDK is loaded lazily only when the integrity monitor is actually
 * rendered in a native development/preview/production build.
 *
 * Everything decidable lives in the pure policy module. This file only turns
 * the SDK's callbacks into calls on it.
 *
 * Native detection itself still requires a real development/preview build
 * on-device.
 */

export interface IntegrityMonitorDeps {
  variant: Env["variant"];

  bundleId: string;

  integrity: IntegrityState;

  /**
   * Called when the app itself is compromised.
   * In practice this should be `session.clear`.
   */
  onSessionCompromised: () => void;

  /**
   * Called for every integrity signal.
   *
   * Signal names only — never attach device data.
   */
  onSignal?: ((signal: IntegritySignal, response: IntegrityResponse) => void) | undefined;

  watcherMail: string;

  appTeamId: string;
}

/**
 * Whether runtime integrity monitoring should run.
 *
 * It is disabled in development because:
 *
 * - Expo Go does not contain the freeRASP native module.
 * - Simulators/debug builds intentionally trigger security signals.
 *
 * Preview and production native builds render the integrity monitor and load
 * the SDK lazily.
 */
export function shouldMonitorIntegrity(variant: Env["variant"]): boolean {
  return variant !== "development";
}

/**
 * Subscribe to freeRASP's signals for the lifetime of the component.
 *
 * This hook must be called unconditionally by the IntegrityMonitor component.
 *
 * Gate whether IntegrityMonitor itself renders instead of conditionally calling
 * this hook.
 */
export function useIntegrityMonitor({
  variant,
  bundleId,
  integrity,
  onSessionCompromised,
  onSignal,
  watcherMail,
  appTeamId,
}: IntegrityMonitorDeps): void {
  const useFreeRasp = loadUseFreeRasp();

  useFreeRasp(
    {
      watcherMail,

      iosConfig: {
        appBundleId: bundleId,
        appTeamId,
      },

      isProd: variant === "production",

      /**
       * Do not terminate the app directly.
       *
       * The client records the integrity state and clears the session when
       * appropriate. Server-side authorization remains the real enforcement
       * boundary.
       */
      killOnBypass: false,
    },

    buildActions({
      integrity,
      onSessionCompromised,
      onSignal,
    }),
  );
}

/**
 * Builds freeRASP's callback object.
 *
 * Every recognized signal goes through the same handler so there is one place
 * where a native integrity event turns into SundayBest behavior.
 *
 * Exported separately so the policy wiring can be tested without requiring the
 * native module or physical device.
 */
export function buildActions({
  integrity,
  onSessionCompromised,
  onSignal,
}: Pick<
  IntegrityMonitorDeps,
  "integrity" | "onSessionCompromised" | "onSignal"
>): ThreatEventActions {
  const handle = (signal: IntegritySignal) => (): void => {
    /**
     * Nothing here should escape as an exception.
     *
     * These callbacks are invoked by the native security SDK. Throwing from
     * them would turn an integrity signal into an application crash and could
     * hide subsequent security events.
     */
    try {
      const response = integrity.report(signal);

      onSignal?.(signal, response);

      if (response === "clear-session") {
        onSessionCompromised();
      }
    } catch {
      /**
       * Intentionally swallowed.
       *
       * The individual signal may be lost, but the application stays alive.
       */
    }
  };

  return Object.fromEntries(INTEGRITY_SIGNALS.map((signal) => [signal, handle(signal)]));
}

type FreeRaspModule = typeof FreeRasp;

type UseFreeRasp = FreeRaspModule["useFreeRasp"];

declare const require: (path: string) => FreeRaspModule;

/**
 * Keep the native package out of Expo Go's module-evaluation path.
 *
 * Metro may still bundle the JavaScript dependency, but the package is not
 * evaluated until this function actually executes.
 *
 * `ApiProvider` does not render IntegrityMonitor inside Expo Go, so this
 * require never runs there.
 */
function loadUseFreeRasp(): UseFreeRasp {
  return require("freerasp-react-native").useFreeRasp;
}
