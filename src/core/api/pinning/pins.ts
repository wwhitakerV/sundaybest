import { z } from "zod";

/**
 * TLS public-key pins.
 *
 * A pin is the base64-encoded SHA-256 of a certificate's Subject Public Key
 * Info — the *key*, not the certificate. Certificates rotate far more often than
 * keys, so certificate pins expire and brick installed apps.
 *
 * These are placeholders. `pinning.ts` refuses to run in preview or production
 * while they still are, because a build that believes it is pinned while pinning
 * nothing is worse than one with no pinning: it stops anyone from looking.
 */

/**
 * A base64 SHA-256 digest: 43 base64 characters and one `=` of padding.
 *
 * Validated because these strings are handed to the native layer, and a
 * mistyped pin is indistinguishable from a working one until a connection fails
 * on a user's device.
 */
const PIN_HASH = /^[A-Za-z0-9+/]{43}=$/;

/**
 * Placeholder values, shaped like real pins so the format check still exercises
 * the real path. Replace both before any preview build — see
 * docs/SETUP_CHECKLIST.md.
 */
export const PLACEHOLDER_PRIMARY_PIN = "PLACEHOLDERPLACEHOLDERPLACEHOLDERprimaryAAA=";
export const PLACEHOLDER_BACKUP_PIN = "PLACEHOLDERPLACEHOLDERPLACEHOLDERbackupBBBB=";

const PLACEHOLDERS: ReadonlySet<string> = new Set([
  PLACEHOLDER_PRIMARY_PIN,
  PLACEHOLDER_BACKUP_PIN,
]);

/**
 * Two pins per domain, and both are required.
 *
 * TrustKit enforces a minimum of two, but the reason is operational rather than
 * cryptographic: with a single pin, rotating the key bricks every installed copy
 * of the app until users update. `backup` must be the hash of a key that is
 * generated, held offline, and **not yet in use** — a backup pin for a key you
 * do not have is not a backup.
 */
const domainPinsSchema = z.object({
  primary: z.string().regex(PIN_HASH, "must be a base64 SHA-256 digest"),
  backup: z.string().regex(PIN_HASH, "must be a base64 SHA-256 digest"),
  /** Pin subdomains too. Off unless a domain actually needs it. */
  includeSubdomains: z.boolean(),
});

export const pinConfigSchema = z.record(z.string().min(1), domainPinsSchema);

export type PinConfig = z.infer<typeof pinConfigSchema>;

/**
 * The app's pins, by domain.
 *
 * Only hosts the app actually talks to belong here. Pinning a domain the app
 * never reaches achieves nothing; failing to pin one it does reach achieves
 * nothing either, which is why this list and `EXPO_PUBLIC_API_URL` have to agree.
 */
export const PIN_CONFIG: PinConfig = {
  "api.sundaybest.com": {
    primary: PLACEHOLDER_PRIMARY_PIN,
    backup: PLACEHOLDER_BACKUP_PIN,
    includeSubdomains: false,
  },
};

function isPlaceholderPin(hash: string): boolean {
  return PLACEHOLDERS.has(hash);
}

/** Every pin still carrying a placeholder value, by `domain.role`. */
export function findPlaceholderPins(config: PinConfig): string[] {
  // Named reads rather than an indexed loop: `pins[role]` is a computed member
  // access, which security/detect-object-injection flags, and with two roles a
  // loop buys nothing anyway.
  return Object.entries(config).flatMap(([domain, pins]) => {
    const offenders: string[] = [];

    if (isPlaceholderPin(pins.primary)) offenders.push(`${domain}.primary`);
    if (isPlaceholderPin(pins.backup)) offenders.push(`${domain}.backup`);

    return offenders;
  });
}
