import { StyleSheet } from "react-native";
import { Svg } from "react-native-svg";
import { render, screen, fireEvent, within } from "@tests/helpers/render";
import * as Clipboard from "expo-clipboard";
import { useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { FIELD_ICON_CENTRE } from "@/features/plan-creation/components/field-geometry";
import { lightTheme } from "@/theme/tokens";
import { NewPlanScreen } from "@/features/plan-creation/screens/NewPlanScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
  useIsFocused: () => true,
}));

jest.mock("expo-clipboard", () => ({ getStringAsync: jest.fn() }));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockExitModal = jest.fn<void, []>();
const LINK = "https://youtube.com/watch?v=Qm81xRz4";

beforeEach(() => {
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitModal }),
  });
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

async function goToLinkPreview(link = LINK) {
  fireEvent.changeText(screen.getByTestId("paste-sermon-link-input"), link);
  fireEvent.press(screen.getByTestId("paste-sermon-continue-button"));
  await screen.findByTestId("link-preview-body");
}

describe("NewPlanScreen", () => {
  it("is addressable as new-plan-screen", () => {
    render(<NewPlanScreen />);

    expect(screen.getByTestId("new-plan-screen")).toBeVisible();
  });

  it("opens on Paste Sermon with its step context", () => {
    render(<NewPlanScreen />);

    expect(screen.getByText("New plan")).toBeVisible();
    expect(screen.getByText("1 of 2")).toBeVisible();
    expect(screen.getByTestId("paste-sermon-body")).toBeVisible();
  });

  it("keeps Continue off until there's a link", () => {
    render(<NewPlanScreen />);

    expect(screen.getByTestId("paste-sermon-continue-button")).toBeDisabled();
  });

  it("fills the link from the clipboard when Paste is pressed", async () => {
    jest.mocked(Clipboard.getStringAsync).mockResolvedValue(LINK);
    render(<NewPlanScreen />);

    fireEvent.press(screen.getByTestId("paste-sermon-link-input-paste-button"));

    expect(await screen.findByDisplayValue(LINK)).toBeVisible();
    expect(screen.getByTestId("paste-sermon-continue-button")).toBeEnabled();
  });

  it("says so when the link isn't a link, and stays put", () => {
    render(<NewPlanScreen />);

    fireEvent.changeText(screen.getByTestId("paste-sermon-link-input"), "last sunday");
    fireEvent.press(screen.getByTestId("paste-sermon-continue-button"));

    expect(screen.getByTestId("paste-sermon-link-input-error")).toBeVisible();
    expect(screen.getByTestId("paste-sermon-body")).toBeVisible();
  });

  it("dismisses the whole modal when Close is pressed", () => {
    render(<NewPlanScreen />);

    fireEvent.press(screen.getByTestId("paste-sermon-close-button"));

    expect(mockExitModal).toHaveBeenCalledTimes(1);
  });

  it("shows the link's sermon on Link Preview, in place rather than navigating", async () => {
    render(<NewPlanScreen />);

    await goToLinkPreview();

    expect(screen.getByText("2 of 2")).toBeVisible();
    expect(screen.getByText("Today I Choose to Be a Blessing")).toBeVisible();
    expect(screen.getByText("…/watch?v=Qm81xRz4")).toBeVisible();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("says when a plan of the chosen length would end", async () => {
    render(<NewPlanScreen />);
    await goToLinkPreview();

    fireEvent.press(screen.getByTestId("link-preview-days-3"));

    expect(screen.getByText("Ends Wednesday.")).toBeVisible();
    expect(screen.getByTestId("link-preview-days-3")).toBeSelected();
  });

  it("steps back to Paste Sermon when Back is pressed", async () => {
    render(<NewPlanScreen />);
    await goToLinkPreview();

    fireEvent.press(screen.getByTestId("link-preview-back-button"));

    expect(await screen.findByTestId("paste-sermon-body")).toBeVisible();
    expect(mockExitModal).not.toHaveBeenCalled();
  });

  it("creates the plan and moves on to Preparing when Create my plan is pressed", async () => {
    render(<NewPlanScreen />);
    await goToLinkPreview();

    fireEvent.press(screen.getByTestId("link-preview-create-plan-button"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(plan-creation)/preparing",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.any()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
      params: { planId: expect.any(String) },
    });
  });

  it("shows the search guidance exactly once in search mode", () => {
    render(<NewPlanScreen />);

    fireEvent.press(screen.getByTestId("new-plan-search-instead"));

    expect(screen.getAllByText("Search by pastor, church, topic, or sermon title.")).toHaveLength(
      1,
    );
  });

  describe.each([
    ["paste", "new-plan-search-instead", "search-sermons-input"],
    ["search", "new-plan-paste-instead", "paste-sermon-link-input"],
  ])("the option to switch input mode, in %s mode", (mode, testID) => {
    function renderInMode() {
      render(<NewPlanScreen />);
      if (mode === "search") fireEvent.press(screen.getByTestId("new-plan-search-instead"));
      const option = screen.getByTestId(testID);
      return { option, style: StyleSheet.flatten(option.props.style as object) };
    }

    it("is regular weight", () => {
      const { option } = renderInMode();

      expect(within(option).getByText(/instead$/)).toHaveStyle({ fontWeight: "400" });
    });

    it("draws its label in the inactive text colour", () => {
      const { option } = renderInMode();

      expect(within(option).getByText(/instead$/)).toHaveStyle({
        color: lightTheme.colors.textInactive,
      });
    });

    it("draws its icon in the inactive text colour", () => {
      const { option } = renderInMode();

      expect(within(option).UNSAFE_getByType(Svg).props.stroke).toBe(
        lightTheme.colors.textInactive,
      );
    });

    it("centres its icon under the fields' leading icons", () => {
      const { style } = renderInMode();

      expect(style).toMatchObject({ paddingLeft: FIELD_ICON_CENTRE - 18 / 2 });
    });

    it("leaves 16pt of room beneath it", () => {
      const { style } = renderInMode();

      expect(style).toMatchObject({ marginBottom: 16 });
    });
  });
});
