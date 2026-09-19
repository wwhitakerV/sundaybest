import { useFreeRasp, type ThreatEventActions } from "freerasp-react-native";

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
 * Everything decidable lives in that pure module; this file only turns the
 * SDK's callbacks into calls on it. Native, so these tests cover the wiring and
 * say nothing about whether freeRASP actually detects a jailbreak — that needs a
 * development build on a modified device.
 */

/**
 * PLACEHOLDERS. Both need real values before a preview build — see
 * docs/SETUP_CHECKLIST.md.
 *
 * `watcherMail` is where Talsec sends threat reports, and `appTeamId` is the
 * Apple Developer team ID. Neither is a secret: the team ID is readable from any
 * distributed build, and the address is an alias. They are placeholders because
 * they are account facts nobody has yet, not because they are sensitive.
 */
export const PLACEHOLDER_WATCHER_MAIL = "PLACEHOLDER-security@sundaybest.com";
export const PLACEHOLDER_APP_TEAM_ID = "PLACEHOLDERTEAMID";

export interface IntegrityMonitorDeps {
  variant: Env["variant"];
  bundleId: string;
  integrity: IntegrityState;
  /** Called when the app itself is compromised. In practice `session.clear`. */
  onSessionCompromised: () => void;
  /** Called for every signal. Names only — never device data. */
  // `| undefined` explicitly: exactOptionalPropertyTypes is on, and this gets
  // forwarded to buildActions, which would otherwise reject the absent case.
  onSignal?: ((signal: IntegritySignal, response: IntegrityResponse) => void) | undefined;
  watcherMail?: string;
  appTeamId?: string;
}

/**
 * Whether integrity monitoring should run at all.
 *
 * Off in development: a simulator trips `simulator`, `debug`, and `devMode` by
 * design, so running it there produces nothing but noise and a session that
 * clears itself on every launch.
 *
 * Callers use this to decide whether to **render** the component that calls
 * `useIntegrityMonitor` — a hook cannot be called conditionally.
 */
export function shouldMonitorIntegrity(variant: Env["variant"]): boolean {
  return variant !== "development";
}

/**
 * Subscribes to freeRASP's signals for the life of the component.
 *
 * Must be called unconditionally, per the rules of hooks. Gate on
 * `shouldMonitorIntegrity` by choosing whether to render the component that
 * calls this, not by branching around the call.
 */
export function useIntegrityMonitor({
  variant,
  bundleId,
  integrity,
  onSessionCompromised,
  onSignal,
  watcherMail = PLACEHOLDER_WATCHER_MAIL,
  appTeamId = PLACEHOLDER_APP_TEAM_ID,
}: IntegrityMonitorDeps): void {
  useFreeRasp(
    {
      watcherMail,
      iosConfig: { appBundleId: bundleId, appTeamId },
      isProd: variant === "production",
      // Never. A security control that terminates the app on an unfamiliar
      // device has stopped being a control and become the outage — and on a
      // device the attacker owns it is patched out in minutes anyway. The app
      // degrades instead; the server is what actually refuses.
      killOnBypass: false,
    },
    buildActions({ integrity, onSessionCompromised, onSignal }),
  );
}

/**
 * Builds freeRASP's callback object.
 *
 * Every recognised signal gets the same handler, so there is exactly one place
 * where a signal turns into behaviour. Exported for its own tests, because
 * asserting on the wiring is the only thing that can be asserted without a
 * device.
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
    // Nothing in here may throw: it runs inside a callback the SDK invokes, and
    // a rejection escaping a security callback is both a crash and a blind spot.
    try {
      const response = integrity.report(signal);

      onSignal?.(signal, response);

      if (response === "clear-session") onSessionCompromised();
    } catch {
      // Swallowed on purpose — see above. The signal is lost; the app survives.
    }
  };

  return Object.fromEntries(INTEGRITY_SIGNALS.map((signal) => [signal, handle(signal)]));
}
