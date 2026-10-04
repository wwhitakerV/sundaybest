import * as Crypto from "expo-crypto";

/** A fresh idempotency key for one logical mutation. Reuse belongs to the transport retry layer. */
export function createIdempotencyKey(scope: string): string {
  return `${scope}:${Crypto.randomUUID()}`;
}
