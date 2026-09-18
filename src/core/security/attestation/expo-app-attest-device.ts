import * as AppIntegrity from "@expo/app-integrity";
import { Platform } from "react-native";

import type { AppAttestDevice, DeviceSupport } from "./attestation";

/**
 * The Secure Enclave, via `@expo/app-integrity`.
 *
 * Deliberately almost empty: this is the one part of attestation that cannot be
 * unit-tested against real hardware, so every decision that could be made here
 * is made in `app-attest.ts` instead.
 *
 * `@expo/app-integrity` is pinned to an **exact** version. It is a young library
 * and this is the code path that decides whether the backend trusts a request,
 * so it does not float on a range.
 */
export const expoAppAttestDevice: AppAttestDevice = {
  support(): DeviceSupport {
    // The platform check has to come first. `@expo/app-integrity` computes
    //
    //     isSupported = Platform.OS === 'ios' ? native.isSupported : true
    //
    // so on a non-iOS platform it reports `true`, meaning "the Android
    // integrity path is available" — not "App Attest is available". Reading it
    // without checking the platform would report an Apple attestation
    // capability the device does not have.
    if (Platform.OS !== "ios") {
      return { supported: false, reason: "platform" };
    }

    // Read on every call, never captured at module scope: the library exports
    // this as a const evaluated at import time, so a module-level copy would
    // freeze whatever it was then — which under Jest is `undefined`. Compared
    // against `true` rather than coerced, so an absent constant is treated as
    // unavailable rather than as a truthy object.
    return AppIntegrity.isSupported === true
      ? { supported: true }
      : { supported: false, reason: "app-attest-unavailable" };
  },

  generateKey: () => AppIntegrity.generateKeyAsync(),

  attestKey: (keyId, challenge) => AppIntegrity.attestKeyAsync(keyId, challenge),

  createAssertion: (keyId, challenge) => AppIntegrity.generateAssertionAsync(keyId, challenge),
};
