import { Text } from "react-native";
import { render, screen, within } from "@tests/helpers/render";
import type { LucideIcon } from "lucide-react-native";

import { lightTheme } from "@/theme/tokens";
import { IconRing } from "@/ui/atoms/IconRing";

/** Stands in for an icon: prints the size and colour it was drawn with. */
const Probe = (({ size, color }: { size?: number; color?: string }) => (
  <Text testID="icon">{`${size}|${color}`}</Text>
)) as unknown as LucideIcon;

/** Prints the fill it was drawn with, "none" when it had none. */
const FillProbe = (({ fill }: { fill?: string }) => (
  <Text testID="icon">{`fill:${fill ?? "none"}`}</Text>
)) as unknown as LucideIcon;

describe("IconRing", () => {
  it("forwards testID to the ring", () => {
    render(<IconRing testID="a-ring" icon={Probe} />);

    expect(screen.getByTestId("a-ring")).toBeVisible();
  });

  it("is a 160pt circle with a 10pt segment-coloured band", () => {
    render(<IconRing testID="a-ring" icon={Probe} />);

    expect(screen.getByTestId("a-ring")).toHaveStyle({
      width: 160,
      height: 160,
      borderRadius: 80,
      borderWidth: 10,
      borderColor: lightTheme.colors.segmentBackground,
    });
  });

  it("centres its icon, drawn 56pt in the accent colour", () => {
    render(<IconRing testID="a-ring" icon={Probe} />);

    expect(screen.getByTestId("a-ring")).toHaveStyle({
      alignItems: "center",
      justifyContent: "center",
    });
    expect(within(screen.getByTestId("a-ring")).getByTestId("icon")).toHaveTextContent(
      `56|${lightTheme.colors.accent}`,
    );
  });

  it("draws its icon as an outline, never filled", () => {
    render(<IconRing testID="a-ring" icon={FillProbe} />);

    expect(screen.getByTestId("icon")).toHaveTextContent("fill:none");
  });

  it("draws its band in the accent when it marks something done", () => {
    render(<IconRing testID="a-ring" icon={FillProbe} done />);

    expect(screen.getByTestId("a-ring")).toHaveStyle({ borderColor: lightTheme.colors.accent });
  });

  it("draws its band in the quiet grey otherwise", () => {
    render(<IconRing testID="a-ring" icon={FillProbe} />);

    expect(screen.getByTestId("a-ring")).toHaveStyle({
      borderColor: lightTheme.colors.segmentBackground,
    });
  });
});
