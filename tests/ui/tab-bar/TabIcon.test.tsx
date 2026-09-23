import { House } from "lucide-react-native";
import { render, screen } from "@tests/helpers/render";

import { TabIcon } from "@/ui/tab-bar/TabIcon";

describe("TabIcon", () => {
  it("draws the icon at the theme's shared stroke width", () => {
    render(<TabIcon testID="a-tab-icon" icon={House} color="#000" size={24} />);

    expect(screen.getByTestId("a-tab-icon")).toHaveProp("strokeWidth", 2);
  });
});
