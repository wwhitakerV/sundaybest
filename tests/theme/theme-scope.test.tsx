import { Text } from "react-native";
import { render, screen } from "@tests/helpers/render";

import { darkTheme, lightTheme } from "@/theme/tokens";
import { ThemeScope } from "@/theme/theme-scope";
import { useTheme } from "@/theme/use-theme";

function Probe() {
  return <Text testID="probe">{useTheme().colors.background}</Text>;
}

describe("ThemeScope", () => {
  it("gives everything inside it the theme it was handed", () => {
    render(
      <ThemeScope theme={darkTheme}>
        <Probe />
      </ThemeScope>,
    );

    expect(screen.getByTestId("probe")).toHaveTextContent(darkTheme.colors.background);
  });

  it("leaves what is outside it on the light theme", () => {
    render(
      <>
        <ThemeScope theme={darkTheme}>
          <Text>inside</Text>
        </ThemeScope>
        <Probe />
      </>,
    );

    expect(screen.getByTestId("probe")).toHaveTextContent(lightTheme.colors.background);
  });

  it("is the light theme with no scope at all", () => {
    render(<Probe />);

    expect(screen.getByTestId("probe")).toHaveTextContent(lightTheme.colors.background);
  });

  it("lets the nearest scope win when they nest", () => {
    render(
      <ThemeScope theme={darkTheme}>
        <ThemeScope theme={lightTheme}>
          <Probe />
        </ThemeScope>
      </ThemeScope>,
    );

    expect(screen.getByTestId("probe")).toHaveTextContent(lightTheme.colors.background);
  });
});
