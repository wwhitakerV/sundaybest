import { validateDeepLink } from "@/core/security/deep-links/validate-deep-link";

/**
 * Expo Router's hook for inbound URLs, called both for a cold launch from a link
 * and for a link received while the app is running.
 *
 * Delegation only, because `src/app` holds routing and nothing else. The
 * decision lives in `@/core/security/deep-links/validate-deep-link`, which is
 * pure and tested; anything not on its allowlist resolves to the home screen.
 *
 * Nothing is logged here. A deep link is attacker-controlled text handed over by
 * any app on the device, and the only logger available today would be a console
 * call with that text in it. `describeDecision` in the validator returns a reason
 * code with no URL in it, and is what to use once `src/core/monitoring` exists.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  return validateDeepLink(path).path;
}
