import { z } from "zod";

import type { Example } from "../types";

/**
 * Data access for this slice. A request function sends through `src/core`'s
 * client (never `fetch` here), takes an `AbortSignal`, and hands what comes
 * back to a parser like this one: the Zod schema for the transport shape and
 * the mapping to the slice's domain shape. Anything crossing into the app is
 * parsed here, never cast.
 */

/** What the server sends: its own field names, checked. */
const exampleSchema = z.object({ id: z.string().min(1), name: z.string() });

/** Parses an untrusted payload into the slice's domain shape. Throws on bad data. */
export function parseExample(payload: unknown): Example {
  const dto = exampleSchema.parse(payload);
  return { id: dto.id, title: dto.name };
}
