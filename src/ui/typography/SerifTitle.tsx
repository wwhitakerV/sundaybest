import { useTheme, type Theme } from "@/theme";
import { ThemedText, type TypographyProps } from "./ThemedText";

export type SerifTitleVariant = "heading" | "title" | "question" | "quiz";

export type SerifTitleProps = TypographyProps & { variant?: SerifTitleVariant };

function typeFor(typography: Theme["typography"], variant: SerifTitleVariant) {
  switch (variant) {
    case "heading":
      return typography.editorialHeading;
    case "title":
      return typography.editorialTitle;
    case "question":
      return typography.editorialQuestion;
    case "quiz":
      return typography.quizQuestion;
  }
}

/** Titles in the editorial face, Libre Baskerville Medium: a heading, a title, a study question, a quiz question. */
export function SerifTitle({ variant = "heading", ...props }: SerifTitleProps) {
  const { typography } = useTheme();
  return <ThemedText type={typeFor(typography, variant)} {...props} />;
}
