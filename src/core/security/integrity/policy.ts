/**
 * What the app does about a runtime integrity signal.
 *
 * Pure: no native module, no React, no logging. freeRASP reports the signals
 * (see `freerasp-integrity.ts`); this decides what they mean, so every branch of
 * the decision is unit-tested rather than trusted.
 *
 * The policy is deliberately three-valued. freeRASP reports two dozen signals,
 * and a policy with two dozen behaviours is one nobody can reason about — least
 * of all at the moment it fires.
 */

/**
 * Signals this policy recognises, named as freeRASP names them so the mapping
 * can be checked against its `ThreatEventActions` type by eye.
 *
 * Not exhaustive on purpose: freeRASP adds signals between releases, and an
 * unknown one is handled by `resolveThreatResponse` rather than by this list
 * having to be complete.
 */
export const INTEGRITY_SIGNALS = [
  "appIntegrity",
  "hooks",
  "unofficialStore",
  "debug",
  "privilegedAccess",
  "simulator",
  "passcode",
  "systemVPN",
  "deviceBinding",
  "deviceID",
  "secureHardwareNotAvailable",
  "obfuscationIssues",
  "devMode",
  "screenshot",
  "screenRecording",
  "malware",
  "multiInstance",
  "timeSpoofing",
  "locationSpoofing",
  "unsecureWifi",
  "automation",
] as const;

export type IntegritySignal = (typeof INTEGRITY_SIGNALS)[number];

export type IntegrityResponse = "clear-session" | "disable-sensitive" | "report-only";

/**
 * The app or its runtime has been modified. Whatever the app is holding may
 * already be observed, so it stops holding it.
 *
 * `debug` is here rather than in report-only: a debugger attached to a release
 * build is not a developer at work, it is someone reading memory.
 */
const CLEARS_SESSION: ReadonlySet<string> = new Set<IntegritySignal>([
  "appIntegrity",
  "hooks",
  "unofficialStore",
  "debug",
]);

/**
 * The device is not trustworthy, but the app is intact. Degrade rather than
 * refuse — locking out someone who modified their own hardware costs a real user
 * everything and costs an attacker one patch.
 */
const DISABLES_SENSITIVE: ReadonlySet<string> = new Set<IntegritySignal>([
  "privilegedAccess",
  "simulator",
]);

/**
 * Maps a signal to a response.
 *
 * Total, and never throws: it runs inside a callback the SDK invokes, where a
 * thrown error becomes an unhandled rejection in a security path. An
 * unrecognised signal degrades to `report-only` rather than escalating, because
 * escalating on a name nobody has seen before is guessing.
 */
export function resolveThreatResponse(signal: IntegritySignal): IntegrityResponse {
  if (typeof signal !== "string") return "report-only";
  if (CLEARS_SESSION.has(signal)) return "clear-session";
  if (DISABLES_SENSITIVE.has(signal)) return "disable-sensitive";

  return "report-only";
}

interface IntegritySnapshot {
  /** False once any signal has disabled them. Never returns to true. */
  readonly sensitiveAllowed: boolean;
  /** True once tampering was detected, so the session must be cleared. */
  readonly sessionCompromised: boolean;
  /** Every signal seen, in order, deduplicated. Signal names only — never device data. */
  readonly signals: readonly IntegritySignal[];
}

export interface IntegrityState {
  /** Records a signal and returns the response the caller should carry out. */
  report(signal: IntegritySignal): IntegrityResponse;
  /** What the API client gates `sensitive` requests on. */
  isSensitiveAllowed(): boolean;
  snapshot(): IntegritySnapshot;
}

/**
 * The accumulated verdict on this device, for this app run.
 *
 * **One-way.** A device that reported a jailbreak does not become trustworthy
 * because a later check passed: the attacker chooses when checks run, so "it
 * looks fine now" is not evidence of anything. Nothing here clears a flag.
 */
export function createIntegrityState(): IntegrityState {
  const signals: IntegritySignal[] = [];
  let sensitiveAllowed = true;
  let sessionCompromised = false;

  return {
    report(signal) {
      const response = resolveThreatResponse(signal);

      if (typeof signal === "string" && !signals.includes(signal)) signals.push(signal);

      if (response === "clear-session") {
        sessionCompromised = true;
        // Tampering implies the weaker verdict too. Stated rather than implied,
        // so reading either flag alone is still correct.
        sensitiveAllowed = false;
      }

      if (response === "disable-sensitive") sensitiveAllowed = false;

      return response;
    },

    isSensitiveAllowed() {
      return sensitiveAllowed;
    },

    snapshot() {
      return Object.freeze({
        sensitiveAllowed,
        sessionCompromised,
        signals: Object.freeze([...signals]),
      });
    },
  };
}
