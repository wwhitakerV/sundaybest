import { env } from "./env";
import type { Env } from "./env-schema";

/**
 * Feature flags.
 *
 * Static per variant for now, but behind `FlagSource` so a remote source can be
 * dropped in later without touching call sites. Whatever that source turns out
 * to be, it stays inside `src/core` — it is a network dependency.
 *
 * Two rules keep this honest:
 *
 *  1. **A flag is derived from `Env`, never declared twice.** Every value below
 *     is computed from the parsed environment, so there is one source of truth
 *     for what a build is configured to do.
 *  2. **Only flags with a real consumer.** A flag nobody reads is dead config
 *     that still has to be understood; add one when the code that honours it
 *     lands.
 */

export const FEATURE_FLAGS = ["attestation", "crashReporting", "verboseLogging"] as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[number];

export interface FlagSource {
  /** Whether a flag is on for this build. */
  isEnabled(flag: FeatureFlag): boolean;
  /**
   * Every flag and its current value. Useful for a debug screen or a crash
   * report's context — never for branching, which should ask `isEnabled`.
   */
  snapshot(): Readonly<Record<FeatureFlag, boolean>>;
}

/**
 * Resolves the flags for a given environment.
 *
 * Takes `Env` as an argument rather than reading the module singleton, so the
 * rules are testable without reloading modules or mutating `process.env`.
 */
export function createStaticFlagSource(config: Env): FlagSource {
  const values: Record<FeatureFlag, boolean> = {
    attestation: config.attestationEnabled,
    // No DSN means there is nowhere to send a crash, so the feature is off
    // rather than half-initialised.
    crashReporting: config.sentryDsn !== undefined,
    // Never in a shipped build: logs on a real device are readable, and the
    // security rules forbid user or device data reaching them.
    verboseLogging: config.variant !== "production",
  };

  const snapshot = Object.freeze({ ...values });

  return {
    isEnabled(flag) {
      // A switch rather than `values[flag]`: indexing an object with a key the
      // caller supplied is what security/detect-object-injection warns about,
      // and TypeScript makes this switch exhaustive, so adding a flag to
      // FEATURE_FLAGS without handling it here is a compile error.
      switch (flag) {
        case "attestation":
          return values.attestation;
        case "crashReporting":
          return values.crashReporting;
        case "verboseLogging":
          return values.verboseLogging;
      }
    },
    snapshot() {
      return snapshot;
    },
  };
}

/** The flags for this build. */
export const flags: FlagSource = createStaticFlagSource(env);
