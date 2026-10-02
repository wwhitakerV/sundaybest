import { z } from "zod";

/** The route's params, checked: route params are untrusted input. */
const exampleParamsSchema = z.object({ id: z.string().min(1).max(64) });

/** The example's ID from the route, or null when the params don't name one. */
export function parseExampleParams(params: unknown): { id: string } | null {
  const parsed = exampleParamsSchema.safeParse(params);
  return parsed.success ? { id: parsed.data.id } : null;
}
