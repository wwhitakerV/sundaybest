import { useGlobalTextScale } from "@/theme";

/** The reader-selected app-wide type scale supplied by the composition root. */
export function useTextScale(): number {
  return useGlobalTextScale();
}
