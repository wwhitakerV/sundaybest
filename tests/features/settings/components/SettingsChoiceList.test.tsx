import Svg from "react-native-svg";
import { render, screen, within } from "@tests/helpers/render";

import { SettingsChoiceList } from "@/features/settings/components/SettingsChoiceList";
import { lightTheme } from "@/theme/tokens";

describe("SettingsChoiceList", () => {
  it("gives each choice a row's height: 64 at least, as every list row has", () => {
    render(
      <SettingsChoiceList
        testID="choices"
        choices={[
          { value: "BSB", label: "Berean Standard Bible" },
          { value: "ESV", label: "English Standard Version" },
        ]}
        value="BSB"
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByTestId("choices-ESV")).toHaveStyle({ minHeight: 64 });
  });

  it("ends the chosen row in a black checkmark, as iOS Settings does, and the rest in nothing", () => {
    render(
      <SettingsChoiceList
        testID="choices"
        choices={[
          { value: "BSB", label: "Berean Standard Bible" },
          { value: "ESV", label: "English Standard Version" },
        ]}
        value="BSB"
        onChange={jest.fn()}
      />,
    );

    expect(within(screen.getByTestId("choices-BSB-check")).UNSAFE_getByType(Svg).props.stroke).toBe(
      lightTheme.colors.text,
    );
    expect(screen.queryByTestId("choices-ESV-check")).toBeNull();
    expect(screen.queryByTestId("choices-BSB-radio")).toBeNull();
  });
});
