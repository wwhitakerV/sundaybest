import { useTheme } from "@/theme";
import { GradientBackdrop } from "@/ui/atoms/GradientBackdrop";
import { getHeroPalette } from "../logic/hero-palette";
import { HERO_WASH_OPACITY } from "./hero-layout";

export type HeroBackdropProps = {
  /** The sermon's colours, strongest first; empty until known. */
  colors: readonly string[];
  /** Its still, washed faintly over the gradient; none, no wash. */
  thumbnailUrl: string | null;
  testID?: string;
};

/** A plan hero's backdrop: a gradient of its sermon's own colours, its still washed faintly over it. */
export function HeroBackdrop({ colors, thumbnailUrl, testID }: HeroBackdropProps) {
  const theme = useTheme();
  const { stops } = getHeroPalette(colors, theme.colors.featureBackdrop);

  return (
    <GradientBackdrop
      stops={stops}
      {...(thumbnailUrl && { underlay: { uri: thumbnailUrl, opacity: HERO_WASH_OPACITY } })}
      {...(testID && { testID })}
    />
  );
}
