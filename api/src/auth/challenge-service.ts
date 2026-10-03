import { and, eq, gt, isNull } from "drizzle-orm";

import type { Database } from "../db/client.js";
import { appAttestChallenges, deviceInstallations } from "../db/schema.js";
import { randomToken, sha256 } from "../domain/crypto.js";
import { AppError } from "../http/errors.js";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export interface ChallengeService {
  issue(keyId?: string): Promise<{ challenge: string; expiresAt: string }>;
  consume(input: { challenge: string; keyId?: string }): Promise<void>;
}

export function createChallengeService(db: Database): ChallengeService {
  return {
    async issue(keyId) {
      if (keyId) {
        const rows = await db
          .select({ id: deviceInstallations.id, revokedAt: deviceInstallations.revokedAt })
          .from(deviceInstallations)
          .where(eq(deviceInstallations.attestationKeyId, keyId))
          .limit(1);
        const installation = rows[0];
        if (!installation) throw new AppError("KEY_UNKNOWN", "Unknown App Attest key");
        if (installation.revokedAt) throw new AppError("KEY_REVOKED", "App Attest key is revoked");
      }

      const challenge = randomToken(32);
      const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
      await db.insert(appAttestChallenges).values({ keyId, challengeHash: sha256(challenge), expiresAt });
      return { challenge, expiresAt: expiresAt.toISOString() };
    },

    async consume(input) {
      const challengeHash = sha256(input.challenge);
      const now = new Date();
      const rows = await db
        .select({ id: appAttestChallenges.id, keyId: appAttestChallenges.keyId, expiresAt: appAttestChallenges.expiresAt })
        .from(appAttestChallenges)
        .where(
          and(
            eq(appAttestChallenges.challengeHash, challengeHash),
            isNull(appAttestChallenges.consumedAt),
            gt(appAttestChallenges.expiresAt, now),
          ),
        )
        .limit(1);
      const row = rows[0];
      if (!row) {
        const expired = await db
          .select({ id: appAttestChallenges.id })
          .from(appAttestChallenges)
          .where(eq(appAttestChallenges.challengeHash, challengeHash))
          .limit(1);
        throw new AppError(expired[0] ? "CHALLENGE_EXPIRED" : "CHALLENGE_UNKNOWN", "Challenge is invalid or expired");
      }
      if ((row.keyId ?? undefined) !== input.keyId) throw new AppError("CHALLENGE_UNKNOWN", "Challenge does not match key");

      const updated = await db
        .update(appAttestChallenges)
        .set({ consumedAt: now })
        .where(and(eq(appAttestChallenges.id, row.id), isNull(appAttestChallenges.consumedAt)))
        .returning({ id: appAttestChallenges.id });
      if (!updated[0]) throw new AppError("CHALLENGE_UNKNOWN", "Challenge was already consumed");
    },
  };
}
