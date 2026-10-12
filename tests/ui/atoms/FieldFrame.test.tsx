import { Search } from "lucide-react-native";
import { render, screen, within } from "@tests/helpers/render";
import Svg from "react-native-svg";
import { Text } from "react-native";

import { controlHeight, radius } from "@/theme";
import { lightTheme } from "@/theme/tokens";
import { FIELD_ICON_CENTRE, FieldFrame } from "@/ui/atoms/FieldFrame";

const { colors } = lightTheme;

describe("FieldFrame", () => {
  it("is every one-line field's pill: 52 tall at least, so large text grows it rather than clipping", () => {
    render(
      <FieldFrame testID="field" icon={Search}>
        <Text>Inside</Text>
      </FieldFrame>,
    );

    expect(controlHeight.field).toBe(52);
    expect(screen.getByTestId("field")).toHaveStyle({
      minHeight: controlHeight.field,
      borderRadius: radius.pill,
    });
    expect(screen.getByText("Inside")).toBeVisible();
  });

  it("sits on the page in the soft fill, with a card's edge", () => {
    render(<FieldFrame testID="field" icon={Search} />);

    expect(screen.getByTestId("field")).toHaveStyle({
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.containerBorder,
    });
  });

  it("floats white over the keyboard, raised", () => {
    render(<FieldFrame testID="field" icon={Search} raised />);

    expect(screen.getByTestId("field")).toHaveStyle({
      backgroundColor: colors.background,
      shadowColor: colors.shadow,
    });
  });

  it("goes amber at its edge when what's in it can't be used — never the brand red", () => {
    render(<FieldFrame testID="field" icon={Search} invalid />);

    expect(screen.getByTestId("field")).toHaveStyle({ borderColor: colors.incorrect });
  });

  it("leads with its icon at 20pt, in the supporting grey", () => {
    render(<FieldFrame testID="field" icon={Search} />);

    const icon = within(screen.getByTestId("field")).UNSAFE_getByType(Svg);
    expect(icon.props.width).toBe(20);
    expect(icon.props.stroke).toBe(colors.textSupporting);
  });

  it("names where its icon's centre sits, for what lines up under it", () => {
    // Its edge, 16pt in, then half the 20pt icon.
    expect(FIELD_ICON_CENTRE).toBe(1 + 16 + 10);
  });
});
