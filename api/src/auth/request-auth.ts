import { and, eq, isNull } from "drizzle-orm";
import type { FastifyRequest } from "fastify";

import type { Database } from "../db/client.js";
import { deviceInstallations, users } from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { isValidTimeZone } from "../domain/time.js";
import type { JwtService } from "./jwt.js";

export interface AuthContext {
  userId: string;
  installationId: string;
  keyId: string;
  publicKeyPem: string;
  signCount: number;
  timezone: string;
}

export async function requireAuth(request: FastifyRequest, db: Database, jwt: JwtService): Promise<AuthContext> {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) throw new AppError("UNAUTHORIZED", "Missing bearer token");
  const claims = await jwt.verifyAccessToken(authorization.slice("Bearer ".length));

  const rows = await db
    .select({
      userId: users.id,
      keyId: deviceInstallations.attestationKeyId,
      publicKeyPem: deviceInstallations.publicKeyPem,
      signCount: deviceInstallations.signCount,
      timezone: deviceInstallations.timezone,
    })
    .from(users)
    .innerJoin(deviceInstallations, eq(deviceInstallations.userId, users.id))
    .where(
      and(
        eq(users.id, claims.sub),
        eq(users.status, "active"),
        eq(deviceInstallations.id, claims.installationId),
        isNull(deviceInstallations.revokedAt),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) throw new AppError("UNAUTHORIZED", "Session is no longer active");

  const headerTimezone = readSingleHeader(request, "x-client-timezone");
  if (headerTimezone && !isValidTimeZone(headerTimezone)) throw new AppError("VALIDATION_FAILED", "Invalid X-Client-Timezone");
  const timezone = headerTimezone ?? row.timezone ?? "UTC";
  if (headerTimezone && headerTimezone !== row.timezone) {
    await db
      .update(deviceInstallations)
      .set({ timezone: headerTimezone, lastSeenAt: new Date() })
      .where(eq(deviceInstallations.id, claims.installationId));
  } else {
    await db.update(deviceInstallations).set({ lastSeenAt: new Date() }).where(eq(deviceInstallations.id, claims.installationId));
  }

  return {
    userId: row.userId,
    installationId: claims.installationId,
    keyId: row.keyId,
    publicKeyPem: row.publicKeyPem,
    signCount: row.signCount,
    timezone,
  };
}

export function readSingleHeader(request: FastifyRequest, name: string): string | undefined {
  const value = request.headers[name];
  return Array.isArray(value) ? value[0] : value;
}
