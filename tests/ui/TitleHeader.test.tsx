import { Text } from "react-native";
import { render, screen } from "@tests/helpers/render";

import { TitleHeader } from "@/ui/TitleHeader";

describe("TitleHeader", () => {
  it("shows the title in the screen-title role", () => {
    render(<TitleHeader title="Plans" />);

    expect(screen.getByText("Plans")).toHaveStyle({ fontSize: 29, fontWeight: "500" });
  });

  it("renders its actions", () => {
    render(<TitleHeader title="Plans" actions={<Text>Action</Text>} />);

    expect(screen.getByText("Action")).toBeVisible();
  });
});
