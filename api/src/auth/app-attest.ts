import { verifyAssertion, verifyAttestation } from "node-app-attest";

import type { Env } from "../config/env.js";
import { AppError } from "../http/errors.js";

export interface VerifiedAttestation {
  publicKeyPem: string;
}

export interface VerifiedAssertion {
  signCount: number;
}

export interface AppAttestVerifier {
  verifyAttestation(input: { keyId: string; challenge: string; attestation: string }): VerifiedAttestation;
  verifyAssertion(input: {
    payload: string;
    assertion: string;
    publicKeyPem: string;
    previousSignCount: number;
  }): VerifiedAssertion;
}

export function createAppAttestVerifier(env: Env): AppAttestVerifier {
  return {
    verifyAttestation(input) {
      try {
        const result = verifyAttestation({
          attestation: Buffer.from(input.attestation, "base64"),
          challenge: input.challenge,
          keyId: input.keyId,
          bundleIdentifier: env.APP_ATTEST_BUNDLE_ID,
          teamIdentifier: env.APP_ATTEST_TEAM_ID,
          allowDevelopmentEnvironment: env.APP_ATTEST_ALLOW_DEVELOPMENT,
        });

        return { publicKeyPem: result.publicKey };
      } catch (cause) {
        throw new AppError("ATTESTATION_INVALID", "App Attest verification failed", { cause });
      }
    },

    verifyAssertion(input) {
      try {
        const result = verifyAssertion({
          assertion: Buffer.from(input.assertion, "base64"),
          payload: input.payload,
          publicKey: input.publicKeyPem,
          bundleIdentifier: env.APP_ATTEST_BUNDLE_ID,
          teamIdentifier: env.APP_ATTEST_TEAM_ID,
          signCount: input.previousSignCount,
        });
        if (result.signCount <= input.previousSignCount) {
          throw new Error("App Attest sign counter did not advance");
        }
        return { signCount: result.signCount };
      } catch (cause) {
        throw new AppError("ASSERTION_INVALID", "App Attest assertion verification failed", { cause });
      }
    },
  };
}
