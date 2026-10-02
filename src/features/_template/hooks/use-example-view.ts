import { useLocalSearchParams, useRouter } from "expo-router";

import { describeExample } from "../logic/describe-example";
import { parseExampleParams } from "../logic/example-params";

/**
 * The screen's view model: one hook per screen. It reads and parses the
 * route's params, reads its data — a store selector (`useAppSelector`), or a
 * request through `data/` — derives what the screen shows with `logic/`, and
 * returns one typed view model plus intent handlers. When what the screen is
 * for isn't there, it says `found: false` and the screen renders
 * `NotFoundScreen`.
 */
export function useExampleView() {
  const router = useRouter();
  const params = parseExampleParams(useLocalSearchParams());
  // Stand-in for real data: read it from the store or `data/` by `params.id`.
  const example = params ? { id: params.id, title: params.id } : null;
  const goBack = () => router.back();

  if (!example) return { found: false, goBack } as const;
  return { found: true, title: describeExample(example), goBack } as const;
}
