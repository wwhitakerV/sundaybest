import "dotenv/config";

import { buildApp } from "./app.js";
import { createAppAttestVerifier } from "./auth/app-attest.js";
import { createChallengeService } from "./auth/challenge-service.js";
import { createJwtService } from "./auth/jwt.js";
import { createSessionService } from "./auth/session-service.js";
import { env } from "./config/env.js";
import { createDatabase } from "./db/client.js";
import { createBibleProvider } from "./providers/bible-provider.js";

const database = createDatabase(env);
const jwt = createJwtService(env);
const app = await buildApp({
  env,
  database,
  jwt,
  verifier: createAppAttestVerifier(env),
  challenges: createChallengeService(database.db),
  sessions: createSessionService(database.db, jwt, env),
  bible: createBibleProvider(env),
});

let closing = false;
async function shutdown(signal: string): Promise<void> {
  if (closing) return;
  closing = true;
  app.log.info({ signal }, "shutting down");
  await app.close();
  await database.close();
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void shutdown(signal).finally(() => process.exit(0));
  });
}

try {
  await app.listen({ host: env.HOST, port: env.PORT });
} catch (error) {
  app.log.error(error);
  await database.close();
  process.exitCode = 1;
}
