import { useState } from "react";
import { Image } from "react-native";

import type { ApiPlanSummary } from "@/core/api/contracts";
import { flags } from "@/core/config/flags";
import blessingArt from "../../../../assets/images/mock/today-i-choose-to-be-a-blessing.jpg";
import prayingArt from "../../../../assets/images/mock/still-praying.jpg";
import { previewHome, type HomePreviewArt } from "../logic/home-preview";
import { useChosenPreview } from "./use-home-dev-menu";

/** The made-up plans' artwork, from the app's own mock images. */
function previewArt(): HomePreviewArt {
  return {
    blessing: Image.resolveAssetSource(blessingArt)?.uri ?? null,
    praying: Image.resolveAssetSource(prayingArt)?.uri ?? null,
  };
}

/**
 * Which of Home's states it shows — its real data unless a development build
 * has picked another from the developer menu (`homePreviews`, `useHomeDevMenu`).
 * In any other build, Home is always real.
 */
export function useHomePreview(today: string, real: readonly ApiPlanSummary[]) {
  const enabled = flags.isEnabled("homePreviews");
  const chosen = useChosenPreview();
  const [art] = useState(() => (enabled ? previewArt() : { blessing: null, praying: null }));
  return previewHome(enabled ? chosen : "real", today, art, real);
}
