import { useTheme } from "@/theme";
import { ThemedText, type TypographyProps } from "./ThemedText";

/** SundayBest's text logo, "SUNDAYBEST", in the masthead face. The one place the name is set. */
export function Wordmark(props: Omit<TypographyProps, "children">) {
  const { typography } = useTheme();
  return (
    <ThemedText type={typography.masthead} {...props}>
      SUNDAYBEST
    </ThemedText>
  );
}
