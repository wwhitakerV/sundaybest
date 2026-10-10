import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { render, screen, fireEvent } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { SettingsSubpage } from "@/features/settings/components/SettingsSubpage";
import { space } from "@/theme";
import { lightTheme } from "@/theme/tokens";
import { getFloatingNavBarTop } from "@/ui/organisms/floatingNavBar";
import { EDGE_FADE } from "@/ui/organisms/frame-edges";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { SFProBody } from "@/ui/typography/SFProBody";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useIsFocused: () => true,
}));

const mockBack = jest.fn<void, []>();

beforeEach(() => {
  mockBack.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ back: mockBack } as unknown as ReturnType<typeof useRouter>);
});

function subpage() {
  render(
    <SettingsSubpage testID="a-page" title="Text size">
      <SFProBody>Body</SFProBody>
    </SettingsSubpage>,
  );
}

describe("SettingsSubpage", () => {
  it("starts its content close under the header, the header's fade over it rather than above it", () => {
    subpage();

    const content = StyleSheet.flatten(
      screen.getByTestId("a-page-screen-scroll").props
        .contentContainerStyle as StyleProp<ViewStyle>,
    );
    expect(content.marginTop).toBe(-EDGE_FADE);
  });

  it("ends its last line 24pt above the floating tab bar", () => {
    subpage();

    const content = StyleSheet.flatten(
      screen.getByTestId("a-page-screen-scroll").props
        .contentContainerStyle as StyleProp<ViewStyle>,
    );
    const frameFoot = Number(
      StyleSheet.flatten(
        screen.getByTestId("a-page-screen-bottom-clearance").props.style as StyleProp<ViewStyle>,
      ).height,
    );
    // The frame keeps clear of the home indicator and its fade: the inset, and the fade.
    const insetBottom = frameFoot - EDGE_FADE;
    expect(Number(content.paddingBottom) + frameFoot).toBe(
      getFloatingNavBarTop(insetBottom) + space[24],
    );
  });

  it("spaces its blocks apart, never its last block from the room under it", () => {
    subpage();

    const content = StyleSheet.flatten(
      screen.getByTestId("a-page-screen-scroll").props
        .contentContainerStyle as StyleProp<ViewStyle>,
    );
    expect(content.gap ?? 0).toBe(0);
    expect(screen.getByTestId("a-page-body")).toHaveStyle({ gap: space[24] });
  });

  it("sets its footnote apart at its foot: centred, in the supporting grey", () => {
    render(
      <SettingsSubpage testID="a-page" title="Text size" footnote="A line at the foot.">
        <SFProBody>Body</SFProBody>
      </SettingsSubpage>,
    );

    expect(screen.getByText("A line at the foot.")).toHaveStyle({
      ...lightTheme.typography.cardDetail,
      color: lightTheme.colors.textSupporting,
      textAlign: "center",
    });
    expect(screen.getByTestId("a-page-footnote")).toHaveStyle({
      marginTop: "auto",
      paddingTop: space[40],
    });
  });

  describe("closing on a band", () => {
    function banded() {
      render(
        <SettingsSubpage testID="a-page" title="Meet the creator" band="A closing line.">
          <SFProBody>Body</SFProBody>
        </SettingsSubpage>,
      );
    }

    function scrollPastTheBand() {
      fireEvent(screen.getByTestId("a-page-band"), "layout", {
        nativeEvent: { layout: { x: 0, y: 1000, width: 390, height: 200 } },
      });
      fireEvent.scroll(screen.getByTestId("a-page-screen-scroll"), {
        nativeEvent: { contentOffset: { x: 0, y: 5000 } },
      });
    }

    it("sets its line in white on the app's red, centred", () => {
      banded();

      expect(screen.getByText("A closing line.")).toHaveStyle({
        color: lightTheme.colors.onAccent,
        textAlign: "center",
      });
      expect(screen.getByTestId("a-page-band-fill")).toHaveStyle({
        backgroundColor: lightTheme.colors.accent,
      });
    });

    it("runs edge to edge, out past the page's inset", () => {
      banded();

      expect(screen.getByTestId("a-page-band-fill")).toHaveStyle({
        marginHorizontal: -PAGE_INSET,
      });
    });

    it("runs on in red below its foot, so pulling past the end never shows white", () => {
      banded();

      const runoff = screen.getByTestId("a-page-band-runoff");
      const { height, bottom } = StyleSheet.flatten(runoff.props.style as StyleProp<ViewStyle>);
      expect(runoff).toHaveStyle({
        position: "absolute",
        backgroundColor: lightTheme.colors.accent,
      });
      // Hung wholly below the band: as tall as its drop, never over the line.
      expect(bottom).toBe(-Number(height));
    });

    it("draws its run-off under the line, never over it", () => {
      banded();

      const fill = screen.getByTestId("a-page-band-fill");
      const order = fill.children.map((child) =>
        typeof child === "string" ? child : (child.props as { testID?: string }).testID,
      );
      expect(order[0]).toBe("a-page-band-runoff");
    });

    it("leaves no room under itself, reaching the screen's foot", () => {
      banded();

      const content = StyleSheet.flatten(
        screen.getByTestId("a-page-screen-scroll").props
          .contentContainerStyle as StyleProp<ViewStyle>,
      );
      expect(content.paddingBottom).toBe(0);
    });

    it("keeps the bottom fade until what's above it has cleared the fade", () => {
      banded();

      expect(
        screen.getByTestId("a-page-screen-bottom-edge", { includeHiddenElements: true }),
      ).toHaveStyle({ opacity: 1 });
    });

    it("fades the bottom fade away once what's above it has cleared it", () => {
      banded();
      scrollPastTheBand();

      expect(
        screen.getByTestId("a-page-screen-bottom-edge", { includeHiddenElements: true }),
      ).toHaveStyle({ opacity: 0 });
    });
  });

  it("is the app's scrolling page, its body clear of the floating header and its fade", () => {
    subpage();

    expect(screen.getByTestId("a-page-screen-scroll")).toBeOnTheScreen();
    expect(screen.getByTestId("a-page-screen-top-clearance")).toBeOnTheScreen();
    expect(screen.getByText("Body")).toBeVisible();
  });

  it("is headed by its title, with Back", () => {
    subpage();

    expect(screen.getByText("Text size")).toBeVisible();
    fireEvent.press(screen.getByTestId("a-page-back-button"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
