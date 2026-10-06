import { and, eq, isNull } from "drizzle-orm";

import type { Env } from "../config/env.js";
import type { Database } from "../db/client.js";
import { deviceInstallations, refreshSessions, userSettings, users } from "../db/schema.js";
import { randomToken, sha256 } from "../domain/crypto.js";
import { AppError } from "../http/errors.js";
import type { SessionCredentials } from "../contracts/attestation.js";
import type { JwtService } from "./jwt.js";

export interface SessionService {
  createAnonymousInstall(input: { keyId: string; publicKeyPem: string; timezone?: string }): Promise<SessionCredentials>;
  issueForInstallation(input: { userId: string; installationId: string }): Promise<SessionCredentials>;
  rotate(input: { keyId: string; refreshToken: string }): Promise<SessionCredentials>;
  revokeInstallation(installationId: string): Promise<void>;
  createDevelopmentInstall(input: {
    installationId?: string;
    timezone?: string;
  }): Promise<SessionCredentials>;
}

export function createSessionService(db: Database, jwt: JwtService, env: Env): SessionService {
  const accessExpiresIn = env.ACCESS_TOKEN_TTL_SECONDS;

  async function issue(userId: string, installationId: string): Promise<SessionCredentials> {
    const refreshToken = randomToken(48);
    const refreshTokenHash = sha256(refreshToken);
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000);
    await db.insert(refreshSessions).values({ userId, installationId, refreshTokenHash, expiresAt });
    const accessToken = await jwt.signAccessToken({ sub: userId, installationId });
    return { accessToken, refreshToken, expiresIn: accessExpiresIn };
  }

  return {
    async createAnonymousInstall(input) {
      const existing = await db
        .select({ id: deviceInstallations.id })
        .from(deviceInstallations)
        .where(eq(deviceInstallations.attestationKeyId, input.keyId))
        .limit(1);
      if (existing[0]) throw new AppError("CONFLICT", "Attestation key already registered");

      const created = await db.transaction(async (tx) => {
        const [user] = await tx.insert(users).values({}).returning({ id: users.id });
        if (!user) throw new AppError("INTERNAL", "Could not create user");
        await tx.insert(userSettings).values({ userId: user.id });
        const [installation] = await tx
          .insert(deviceInstallations)
          .values({
            userId: user.id,
            attestationKeyId: input.keyId,
            publicKeyPem: input.publicKeyPem,
            timezone: input.timezone,
          })
          .returning({ id: deviceInstallations.id });
        if (!installation) throw new AppError("INTERNAL", "Could not create installation");
        return { userId: user.id, installationId: installation.id };
      });
      return issue(created.userId, created.installationId);
    },

    issueForInstallation(input) {
      return issue(input.userId, input.installationId);
    },

    async rotate(input) {
      const tokenHash = sha256(input.refreshToken);
      const rows = await db
        .select({
          id: refreshSessions.id,
          userId: refreshSessions.userId,
          installationId: refreshSessions.installationId,
          expiresAt: refreshSessions.expiresAt,
          rotatedAt: refreshSessions.rotatedAt,
          revokedAt: refreshSessions.revokedAt,
          keyId: deviceInstallations.attestationKeyId,
          installationRevokedAt: deviceInstallations.revokedAt,
        })
        .from(refreshSessions)
        .innerJoin(deviceInstallations, eq(refreshSessions.installationId, deviceInstallations.id))
        .where(eq(refreshSessions.refreshTokenHash, tokenHash))
        .limit(1);
      const row = rows[0];
      if (!row || row.keyId !== input.keyId) throw new AppError("REFRESH_TOKEN_INVALID", "Refresh token is invalid");

      if (row.rotatedAt || row.revokedAt) {
        await revokeRefreshFamily(db, row.installationId);
        throw new AppError("REFRESH_TOKEN_INVALID", "Refresh token reuse detected");
      }
      if (row.installationRevokedAt || row.expiresAt <= new Date()) {
        throw new AppError("REFRESH_TOKEN_INVALID", "Refresh token is expired or revoked");
      }

      // Single-use rotation is a compare-and-swap. Two concurrent refreshes
      // cannot both spend the same token and mint independent token chains.
      const rotated = await db
        .update(refreshSessions)
        .set({ rotatedAt: new Date() })
        .where(and(eq(refreshSessions.id, row.id), isNull(refreshSessions.rotatedAt), isNull(refreshSessions.revokedAt)))
        .returning({ id: refreshSessions.id });
      if (!rotated[0]) {
        await revokeRefreshFamily(db, row.installationId);
        throw new AppError("REFRESH_TOKEN_INVALID", "Refresh token reuse detected");
      }
      return issue(row.userId, row.installationId);
    },

    async revokeInstallation(installationId) {
      const now = new Date();
      await db.transaction(async (tx) => {
        await tx.update(deviceInstallations).set({ revokedAt: now }).where(eq(deviceInstallations.id, installationId));
        await tx
          .update(refreshSessions)
          .set({ revokedAt: now })
          .where(and(eq(refreshSessions.installationId, installationId), isNull(refreshSessions.revokedAt)));
      });
    },

    async createDevelopmentInstall(input) {
      if (env.NODE_ENV === "production" || !env.DEV_SESSION_ENABLED) {
        throw new AppError("NOT_FOUND", "Not found");
      }

      const stableId = input.installationId?.trim() || crypto.randomUUID();
      const keyId = `dev:${stableId}`;

      const existingRows = await db
        .select({
          id: deviceInstallations.id,
          userId: deviceInstallations.userId,
        })
        .from(deviceInstallations)
        .where(eq(deviceInstallations.attestationKeyId, keyId))
        .limit(1);

      const existing = existingRows[0];
      if (existing) {
        await db
          .update(deviceInstallations)
          .set({
            ...(input.timezone === undefined ? {} : { timezone: input.timezone }),
            revokedAt: null,
            lastSeenAt: new Date(),
          })
          .where(eq(deviceInstallations.id, existing.id));

        return issue(existing.userId, existing.id);
      }

      const created = await db.transaction(async (tx) => {
        const [user] = await tx.insert(users).values({}).returning({ id: users.id });
        if (!user) throw new AppError("INTERNAL");
        await tx.insert(userSettings).values({ userId: user.id });
        const [installation] = await tx
          .insert(deviceInstallations)
          .values({
            userId: user.id,
            attestationKeyId: keyId,
            publicKeyPem: "development-only",
            timezone: input.timezone,
          })
          .returning({ id: deviceInstallations.id });
        if (!installation) throw new AppError("INTERNAL");
        return { userId: user.id, installationId: installation.id };
      });

      return issue(created.userId, created.installationId);
    },
  };
}

async function revokeRefreshFamily(db: Database, installationId: string): Promise<void> {
  await db
    .update(refreshSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshSessions.installationId, installationId), isNull(refreshSessions.revokedAt)));
}
