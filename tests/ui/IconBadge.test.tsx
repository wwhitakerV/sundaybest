import { render, screen } from "@tests/helpers/render";
import { Lightbulb } from "lucide-react-native";

import { lightTheme } from "@/theme/tokens";
import { IconBadge } from "@/ui/IconBadge";

describe("IconBadge", () => {
  it("sets an icon in a soft round badge", () => {
    render(<IconBadge testID="a-badge" icon={Lightbulb} />);

    expect(screen.getByTestId("a-badge")).toHaveStyle({
      backgroundColor: lightTheme.colors.surface,
      borderRadius: lightTheme.radii.pill,
    });
  });

  it("tints it in the selection's colours when what it marks is picked", () => {
    render(<IconBadge testID="a-badge" icon={Lightbulb} selected />);

    expect(screen.getByTestId("a-badge")).toHaveStyle({
      backgroundColor: lightTheme.colors.selectionBadge,
    });
  });
});
