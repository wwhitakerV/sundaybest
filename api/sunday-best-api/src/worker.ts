import "dotenv/config";

import { env } from "./config/env.js";
import { createDatabase } from "./db/client.js";
import { createBibleProvider } from "./providers/bible-provider.js";
import { createPlanGenerationProvider } from "./providers/plan-generation-provider.js";
import { createTranscriptProvider } from "./providers/transcript-provider.js";
import { createGenerationWorker } from "./worker/generation-worker.js";

const connection = createDatabase(env);
const controller = new AbortController();
const worker = createGenerationWorker({
  db: connection.db,
  sql: connection.sql,
  env,
  transcripts: createTranscriptProvider(env),
  generator: createPlanGenerationProvider(env),
  bible: createBibleProvider(env),
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => controller.abort());
}

try {
  await worker.run(controller.signal);
} finally {
  await connection.close();
}
