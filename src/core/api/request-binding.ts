export type RequestAssertionBinding = {
  method: string;
  path: string;
  body?: unknown;
};

/** Must remain byte-for-byte compatible with api/src/auth/request-binding.ts. */
export function buildRequestAssertionPayload(
  challenge: string,
  binding: RequestAssertionBinding,
): string {
  return `${challenge}\n${binding.method.toUpperCase()}\n${binding.path}\n${canonicalJson(binding.body)}`;
}

function canonicalJson(value: unknown): string {
  if (value === undefined || value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Cannot attest a non-finite number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
    return `{${entries
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalJson(entryValue)}`)
      .join(",")}}`;
  }
  throw new Error(`Cannot attest value of type ${typeof value}`);
}
