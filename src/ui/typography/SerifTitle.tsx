import { useTheme, type Theme } from "@/theme";
import { ThemedText, type TypographyProps } from "./ThemedText";

export type SerifTitleVariant =
  "heading" | "title" | "question" | "questionCompact" | "quiz" | "feature" | "issue";

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
    case "issue":
      return typography.issueTitle;
  }
}

/**
 * Titles in the editorial face: a heading, a title, a study question (and a
 * size under it), a quiz question, a featured study, and a plan featured in
 * the library.
 */
export function SerifTitle({ variant = "heading", ...props }: SerifTitleProps) {
  const { typography } = useTheme();
  return <ThemedText type={typeFor(typography, variant)} {...props} />;
}
