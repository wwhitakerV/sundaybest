import { useTheme, type Theme } from "@/theme";
import { ThemedText, type TypographyProps } from "./ThemedText";

export type SerifTitleVariant =
  "heading" | "title" | "question" | "questionCompact" | "quiz" | "feature" | "statement";

export type SerifTitleProps = TypographyProps & { variant?: SerifTitleVariant };

function typeFor(typography: Theme["typography"], variant: SerifTitleVariant) {
  switch (variant) {
    case "heading":
      return typography.editorialHeading;
    case "title":
      return typography.editorialTitle;
    case "question":
      return typography.editorialQuestion;
    case "questionCompact":
      return typography.editorialQuestionCompact;
    case "quiz":
      return typography.quizQuestion;
    case "feature":
      return typography.featureTitle;
    case "statement":
      return typography.editorialDisplay;
  }
}

/**
 * Titles in the editorial face: a heading, a title, a study question (and a
 * size under it), a quiz question, a featured study, and a statement — one
 * large line of its own (`editorialDisplay`, Canela at 34), as a fact learned.
 */
export function SerifTitle({ variant = "heading", ...props }: SerifTitleProps) {
  const { typography } = useTheme();
  return <ThemedText type={typeFor(typography, variant)} {...props} />;
}
