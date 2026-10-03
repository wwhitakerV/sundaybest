/** Must remain byte-for-byte compatible with the mobile request-binding helper. */
export function buildRequestAssertionPayload(
  challenge: string,
  method: string,
  path: string,
  body: unknown,
): string {
  return `${challenge}\n${method.toUpperCase()}\n${path}\n${canonicalJson(body)}`;
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
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .filter((key) => record[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(",")}}`;
  }
  throw new Error(`Cannot attest value of type ${typeof value}`);
}
