import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { render, screen, fireEvent } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { SettingsSubpage } from "@/features/settings/components/SettingsSubpage";
import { space } from "@/theme";
import { FLOATING_NAV_BAR_CLEARANCE } from "@/ui/organisms/floatingNavBar";
import { EDGE_FADE } from "@/ui/organisms/frame-edges";
import { SFProBody } from "@/ui/typography/SFProBody";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
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

  it("ends a page with a hero 32pt sooner, still clear of the tab bar", () => {
    render(
      <SettingsSubpage testID="a-page" hero={{ overHero: true, onScroll: () => undefined }}>
        <SFProBody>Body</SFProBody>
      </SettingsSubpage>,
    );

    const content = StyleSheet.flatten(
      screen.getByTestId("a-page-screen-scroll").props
        .contentContainerStyle as StyleProp<ViewStyle>,
    );
    expect(content.paddingBottom).toBe(FLOATING_NAV_BAR_CLEARANCE);
  });

  it("ends its content clear of the floating tab bar, so nothing reads under it", () => {
    subpage();

    const content = StyleSheet.flatten(
      screen.getByTestId("a-page-screen-scroll").props
        .contentContainerStyle as StyleProp<ViewStyle>,
    );
    expect(content.paddingBottom).toBe(FLOATING_NAV_BAR_CLEARANCE + space[32]);
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
