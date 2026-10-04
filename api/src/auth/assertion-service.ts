import { and, eq, isNull } from "drizzle-orm";
import type { FastifyRequest } from "fastify";

import type { Database } from "../db/client.js";
import { deviceInstallations } from "../db/schema.js";
import { AppError } from "../http/errors.js";
import type { AppAttestVerifier } from "./app-attest.js";
import type { ChallengeService } from "./challenge-service.js";
import { buildRequestAssertionPayload } from "./request-binding.js";
import type { AuthContext } from "./request-auth.js";
import { readSingleHeader } from "./request-auth.js";

export async function requireSensitiveAssertion(input: {
  request: FastifyRequest;
  auth: AuthContext;
  db: Database;
  challenges: ChallengeService;
  verifier: AppAttestVerifier;
  allowDevelopmentInstall?: boolean;
}): Promise<void> {
  if (input.allowDevelopmentInstall === true && input.auth.keyId.startsWith("dev:")) return;

  const keyId = readSingleHeader(input.request, "x-attestation-keyid");
  const assertion = readSingleHeader(input.request, "x-attestation-assertion");
  const challenge = readSingleHeader(input.request, "x-attestation-challenge");
  if (!keyId || !assertion || !challenge) throw new AppError("ATTESTATION_INVALID", "Sensitive request requires App Attest assertion");
  if (keyId !== input.auth.keyId) throw new AppError("ASSERTION_INVALID", "Assertion key does not match session");

  await input.challenges.consume({ challenge, keyId });
  const verified = input.verifier.verifyAssertion({
    payload: buildRequestAssertionPayload(challenge, input.request.method, input.request.url, input.request.body),
    assertion,
    publicKeyPem: input.auth.publicKeyPem,
    previousSignCount: input.auth.signCount,
  });

  const rows = await input.db
    .update(deviceInstallations)
    .set({ signCount: verified.signCount, lastSeenAt: new Date() })
    .where(
      and(
        eq(deviceInstallations.id, input.auth.installationId),
        eq(deviceInstallations.signCount, input.auth.signCount),
        isNull(deviceInstallations.revokedAt),
      ),
    )
    .returning({ id: deviceInstallations.id });
  if (!rows[0]) throw new AppError("ASSERTION_INVALID", "Assertion counter race or replay detected");
}
