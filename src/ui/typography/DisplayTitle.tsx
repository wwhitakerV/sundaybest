import { useTheme } from "@/theme";
import { ThemedText, type TypographyProps } from "./ThemedText";

/** The hero sentence, in the system face at its largest. */
export function DisplayTitle(props: TypographyProps) {
  const { typography } = useTheme();
  return <ThemedText type={typography.display} {...props} />;
}
