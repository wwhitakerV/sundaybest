import { render, screen } from "@tests/helpers/render";

import { SettingsGroup } from "@/features/settings/components/SettingsGroup";
import type { SettingsRow } from "@/features/settings/logic/settings-sections";
import { lightTheme } from "@/theme/tokens";

const ROWS: readonly SettingsRow[] = [
  { testID: "row-one", label: "One", icon: "bell" },
  { testID: "row-two", label: "Two", icon: "book" },
];

describe("SettingsGroup", () => {
  it("edges its card with the container border", () => {
    render(<SettingsGroup title="General" rows={ROWS} onOpen={() => undefined} />);

    expect(screen.getByTestId("settings-group-general")).toHaveStyle({
      borderColor: lightTheme.colors.containerBorder,
    });
  });
});
