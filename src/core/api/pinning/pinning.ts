import {
  initializeSslPinning,
  isSslPinningAvailable,
  type PinningOptions,
} from "react-native-ssl-public-key-pinning";

import { findPlaceholderPins, pinConfigSchema, PIN_CONFIG, type PinConfig } from "./pins";

/**
 * TLS public-key pinning.
 *
 * **This only works because the app opted out of `expo/fetch`.** SDK 57's
 * default fetch runs its own URLSession with no server-trust callback, so the
 * pinning library cannot see those requests at all — `EXPO_PUBLIC_USE_RN_FETCH=1`
 * is required and enforced by the env schema. Full reasoning in ADR 0006.
 *
 * Native, so none of this is exercised by the unit tests: they cover the config
 * validation and the gate, and say nothing about whether TrustKit actually
 * rejects a bad certificate. That needs a development build and the manual test
 * on the checklist.
 */

type PinnedVariant = "development" | "preview" | "production";

export class PinningError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PinningError";
    Object.setPrototypeOf(this, PinningError.prototype);
  }
}

/**
 * Checks the config is fit to ship, and throws if it is not.
 *
 * Preview and production refuse placeholder pins. A build that reports pinning
 * as enabled while validating nothing is worse than one with no pinning,
 * because it stops anyone from checking again — so this fails loudly at startup
 * instead.
 *
 * Development is exempt, so local work against a proxy or a self-signed
 * certificate still functions. It is also the one variant where an attacker on
 * the network path is not the threat being modelled.
 */
export function assertPinsUsable(variant: PinnedVariant, config: PinConfig = PIN_CONFIG): void {
  const parsed = pinConfigSchema.safeParse(config);
  if (!parsed.success) {
    // Field paths only. A pin is not a secret, but the habit of keeping values
    // out of messages is worth more than the exception.
    throw new PinningError(
      `The TLS pin config is malformed: ${parsed.error.issues
        .map((issue) => issue.path.join("."))
        .join(", ")}.`,
    );
  }

  for (const [domain, pins] of Object.entries(parsed.data)) {
    if (pins.primary === pins.backup) {
      throw new PinningError(
        `The pins for ${domain} are identical, which is one pin rather than a primary and a backup.`,
      );
    }
  }

  if (variant === "development") return;

  if (Object.keys(parsed.data).length === 0) {
    throw new PinningError(
      `The TLS pin config is empty, so a ${variant} build would pin nothing. See docs/SETUP_CHECKLIST.md.`,
    );
  }

  const placeholders = findPlaceholderPins(parsed.data);
  if (placeholders.length > 0) {
    throw new PinningError(
      `A ${variant} build cannot ship placeholder TLS pins: ${placeholders.join(", ")}. ` +
        `Generate the real hashes and a backup key first — see docs/SETUP_CHECKLIST.md.`,
    );
  }
}

/**
 * Flattens the config into the shape the native module expects.
 *
 * Note what is *not* set: `expirationDate`. The library supports it, and it
 * switches pinning off after a date so that apps which stopped receiving
 * updates do not lose connectivity. For this app that trade is wrong — silently
 * ceasing to pin is precisely the failure the placeholder check exists to
 * prevent.
 */
export function toPinningOptions(config: PinConfig = PIN_CONFIG): PinningOptions {
  return Object.fromEntries(
    Object.entries(config).map(([domain, pins]) => [
      domain,
      {
        includeSubdomains: pins.includeSubdomains,
        // Primary first: TrustKit accepts a connection matching any pin, and
        // the order is documentation for whoever reads it next.
        publicKeyHashes: [pins.primary, pins.backup],
      },
    ]),
  );
}

/**
 * Turns pinning on. Returns whether it is actually active.
 *
 * Skipped in development, and skipped when the native module is missing — which
 * is the Expo Go case. It returns `false` rather than throwing there, because
 * "pinning is off in this environment" is a normal state, and it must be
 * distinguishable from "pinning is on".
 */
export async function initializePinning(
  variant: PinnedVariant,
  config: PinConfig = PIN_CONFIG,
): Promise<boolean> {
  assertPinsUsable(variant, config);

  if (variant === "development") return false;

  // Expo Go has no native module. In a release build this being false means the
  // build is broken, which `assertPinsUsable` cannot detect — hence the manual
  // bad-certificate test on the checklist.
  if (!isSslPinningAvailable()) return false;

  await initializeSslPinning(toPinningOptions(config));

  return true;
}
