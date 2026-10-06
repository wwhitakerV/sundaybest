import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

import type { Env } from "../config/env.js";
import { AppError } from "../http/errors.js";

const accessClaimsSchema = z.object({
  sub: z.string().uuid(),
  installationId: z.string().uuid(),
});

export type AccessClaims = z.infer<typeof accessClaimsSchema>;

export interface JwtService {
  signAccessToken(input: AccessClaims): Promise<string>;
  verifyAccessToken(token: string): Promise<AccessClaims>;
}

export function createJwtService(env: Env): JwtService {
  const secret = new TextEncoder().encode(env.JWT_SECRET);

  return {
    async signAccessToken(input) {
      return new SignJWT({ installationId: input.installationId })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setSubject(input.sub)
        .setIssuer(env.JWT_ISSUER)
        .setAudience(env.JWT_AUDIENCE)
        .setJti(crypto.randomUUID())
        .setIssuedAt()
        .setExpirationTime(`${env.ACCESS_TOKEN_TTL_SECONDS}s`)
        .sign(secret);
    },

    async verifyAccessToken(token) {
      try {
        const { payload } = await jwtVerify(token, secret, {
          issuer: env.JWT_ISSUER,
          audience: env.JWT_AUDIENCE,
          algorithms: ["HS256"],
        });
        return accessClaimsSchema.parse({ sub: payload.sub, installationId: payload.installationId });
      } catch (cause) {
        throw new AppError("UNAUTHORIZED", "Invalid or expired access token", { cause });
      }
    },
  };
}
