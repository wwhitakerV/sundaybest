import { z } from "zod";

import { FORMATION_LAYOUTS } from "./formation-layouts";

const IDS = FORMATION_LAYOUTS.map((layout) => layout.id);
const paramsSchema = z.object({ v: z.string() });

/** Which version of Formation the route asks for (`?v=5`, `?v=Line`): the first, unless it names one there is. */
export function parseFormationVersion(params: unknown): string {
  const parsed = paramsSchema.safeParse(params);
  const first = IDS[0] ?? "";
  return parsed.success && IDS.includes(parsed.data.v) ? parsed.data.v : first;
}
