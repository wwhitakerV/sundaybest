import type { Env } from "./config/env.js";
import type { DatabaseConnection } from "./db/client.js";
import type { AppAttestVerifier } from "./auth/app-attest.js";
import type { ChallengeService } from "./auth/challenge-service.js";
import type { JwtService } from "./auth/jwt.js";
import type { SessionService } from "./auth/session-service.js";
import type { BibleProvider } from "./providers/bible-provider.js";

export interface AppContext {
  env: Env;
  database: DatabaseConnection;
  jwt: JwtService;
  verifier: AppAttestVerifier;
  challenges: ChallengeService;
  sessions: SessionService;
  bible: BibleProvider;
}
