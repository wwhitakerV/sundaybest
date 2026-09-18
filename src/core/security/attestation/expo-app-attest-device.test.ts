import * as AppIntegrity from "@expo/app-integrity";
import { Platform } from "react-native";

import { expoAppAttestDevice } from "./expo-app-attest-device";

let mockSupported: unknown = true;

jest.mock("@expo/app-integrity", () => ({
  // A getter, because the real module exports `isSupported` as a const that is
  // evaluated at import time — a plain property would freeze the first value.
  get isSupported() {
    return mockSupported;
  },
  generateKeyAsync: jest.fn(),
  attestKeyAsync: jest.fn(),
  generateAssertionAsync: jest.fn(),
}));

beforeEach(() => {
  mockSupported = true;
});

describe("support", () => {
  it("reports supported on an iOS device that has App Attest", () => {
    expect(expoAppAttestDevice.support()).toEqual({ supported: true });
  });

  /**
   * This is the Simulator case in practice: `DCAppAttestService.isSupported` is
   * `false` there, which is also what Jest sees, since the native constant is
   * absent.
   */
  it("reports app-attest-unavailable when the service is not there", () => {
    mockSupported = false;

    expect(expoAppAttestDevice.support()).toEqual({
      supported: false,
      reason: "app-attest-unavailable",
    });
  });

  it("treats a missing constant as unavailable rather than as supported", () => {
    mockSupported = undefined;

    expect(expoAppAttestDevice.support()).toEqual({
      supported: false,
      reason: "app-attest-unavailable",
    });
  });

  /**
   * The trap this exists for: `@expo/app-integrity` computes
   * `isSupported = Platform.OS === "ios" ? native.isSupported : true`, so on any
   * non-iOS platform it reports **true** — it means "the Android path is
   * available", not "App Attest is available". Checking the platform first is
   * what stops that from being read as an Apple attestation.
   */
  it("checks the platform before the library's own flag", () => {
    const platform = jest.replaceProperty(Platform, "OS", "android");
    mockSupported = true;

    expect(expoAppAttestDevice.support()).toEqual({ supported: false, reason: "platform" });

    platform.restore();
  });
});

describe("delegation to the Secure Enclave", () => {
  it("generates a key", async () => {
    jest.mocked(AppIntegrity.generateKeyAsync).mockResolvedValue("key-1");

    await expect(expoAppAttestDevice.generateKey()).resolves.toBe("key-1");
  });

  it("attests a key over a challenge", async () => {
    jest.mocked(AppIntegrity.attestKeyAsync).mockResolvedValue("attestation-1");

    await expect(expoAppAttestDevice.attestKey("key-1", "chal")).resolves.toBe("attestation-1");
    expect(AppIntegrity.attestKeyAsync).toHaveBeenCalledWith("key-1", "chal");
  });

  it("signs a challenge", async () => {
    jest.mocked(AppIntegrity.generateAssertionAsync).mockResolvedValue("assertion-1");

    await expect(expoAppAttestDevice.createAssertion("key-1", "chal")).resolves.toBe("assertion-1");
    expect(AppIntegrity.generateAssertionAsync).toHaveBeenCalledWith("key-1", "chal");
  });
});
