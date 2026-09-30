import { render, screen } from "@tests/helpers/render";
import { BookOpen, Clock, ListChecks } from "lucide-react-native";

import { lightTheme } from "@/theme/tokens";
import { FactRow } from "@/ui/FactRow";

const FACTS = [
  { key: "questions", icon: ListChecks, label: "15 questions" },
  { key: "duration", icon: Clock, label: "8–12 min" },
  { key: "passages", icon: BookOpen, label: "3 passages" },
];

describe("FactRow", () => {
  it("names each fact, in order", () => {
    render(<FactRow testID="facts" facts={FACTS} />);

    expect(screen.getByTestId("facts-questions")).toHaveTextContent("15 questions");
    expect(screen.getByTestId("facts-duration")).toHaveTextContent("8–12 min");
    expect(screen.getByTestId("facts-passages")).toHaveTextContent("3 passages");
  });

  it("sets them plainly, with nothing behind them to look pressable", () => {
    render(<FactRow testID="facts" facts={FACTS} />);

    expect(screen.getByTestId("facts-duration")).not.toHaveStyle({
      backgroundColor: expect.any(String) as string,
    });
  });

  it("parts them with a thin grey rule, between each and not after the last", () => {
    render(<FactRow testID="facts" facts={FACTS} />);

    const rules = screen.getAllByTestId(/^facts-rule-/, { includeHiddenElements: true });
    expect(rules).toHaveLength(2);
    expect(rules[0]).toHaveStyle({ width: 1, backgroundColor: lightTheme.colors.border });
  });

  it("keeps to one line, its labels shrinking rather than wrapping when room runs short", () => {
    render(<FactRow testID="facts" facts={FACTS} />);

    expect(screen.getByTestId("facts")).toHaveStyle({ flexDirection: "row", flexWrap: "nowrap" });
    expect(screen.getByText("15 questions")).toHaveProp("numberOfLines", 1);
    expect(screen.getByText("15 questions")).toHaveProp("adjustsFontSizeToFit", true);
  });

  it("sets its labels in the system face, small and firm", () => {
    render(<FactRow testID="facts" facts={FACTS} />);

    expect(screen.getByText("8–12 min")).toHaveStyle(lightTheme.typography.factLabel);
  });
});
