import { House, type LucideIcon } from "lucide-react-native";
import { render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { TabIcon } from "@/ui/tab-bar/TabIcon";

describe("TabIcon", () => {
  it("can be found by its testID", () => {
    render(<TabIcon testID="a-tab-icon" icon={House} color="#000" size={24} />);

    expect(screen.getByTestId("a-tab-icon")).toBeOnTheScreen();
  });

  it("draws the icon at the theme's shared stroke width", () => {
    const icon = jest.fn(() => null);
    render(<TabIcon icon={icon as unknown as LucideIcon} color="#000" size={24} />);

    expect(icon).toHaveBeenCalledWith(
      expect.objectContaining({ strokeWidth: lightTheme.icon.strokeWidth }),
      undefined,
    );
  });
});
