import { useTheme } from "@/theme";
import { ThemedText, type TypographyProps } from "./ThemedText";

/** The smallest a fitted title is shrunk to, as a share of its size: past it, it would sooner wrap. */
const FIT_LEAST_SCALE = 0.35;
/** The most lines a fitted title takes before it shrinks further. */
const FIT_LINES = 4;

type DisplayTitleVariant = "hero" | "fit";

export type DisplayTitleProps = TypographyProps & { variant?: DisplayTitleVariant };

/**
 * The largest words on a page, in the display face: the hero sentence, or
 * (`fit`) a title that fills the box it's given — set its width and height
 * by layout — shrinking until the whole of it fits, at its designed size
 * whatever the reader's text size, since the box decides.
 */
export function DisplayTitle({ variant = "hero", ...props }: DisplayTitleProps) {
  const { typography } = useTheme();
  if (variant === "fit") {
    return (
      <ThemedText
        type={typography.fitTitle}
        fixed
        adjustsFontSizeToFit
        minimumFontScale={FIT_LEAST_SCALE}
        numberOfLines={FIT_LINES}
        {...props}
      />
    );
  }
  return <ThemedText type={typography.display} {...props} />;
}
