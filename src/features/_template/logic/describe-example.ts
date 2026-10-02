import type { Example } from "../types";

/** Pure rules and derivations live in `logic/`: same input, same output, no React. */
export function describeExample(example: Example): string {
  return example.title.trim() || "Untitled";
}
