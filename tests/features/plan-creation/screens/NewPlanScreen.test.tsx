import { Sparkles } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { Svg } from "react-native-svg";
import { render, screen, fireEvent, within } from "@tests/helpers/render";
import * as Clipboard from "expo-clipboard";
import { useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";
import { http, HttpResponse } from "msw";

import {
  errorFeedback,
  selectionFeedback,
  successFeedback,
  tapFeedback,
} from "@/core/haptics/haptics";
import { FIELD_ICON_CENTRE } from "@/features/plan-creation/components/field-geometry";
import { lightTheme } from "@/theme/tokens";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { getFloatingNavBarBottom } from "@/ui/organisms/floatingNavBar";
import { NewPlanScreen } from "@/features/plan-creation/screens/NewPlanScreen";
import { API_URL, aGeneration, aSermon } from "@tests/factories/api";
import { server } from "@tests/mocks/server";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
  useIsFocused: () => true,
}));

jest.mock("@/core/haptics/haptics", () => ({
  tapFeedback: jest.fn(),
  selectionFeedback: jest.fn(),
  successFeedback: jest.fn(),
  warningFeedback: jest.fn(),
  errorFeedback: jest.fn(),
}));

jest.mock("expo-clipboard", () => ({ getStringAsync: jest.fn() }));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockExitModal = jest.fn<void, []>();
const LINK = aSermon().canonicalUrl;

beforeEach(() => {
  server.use(
    http.post(`${API_URL}/v1/sermons/resolve`, () => HttpResponse.json({ sermon: aSermon() })),
    http.post(`${API_URL}/v1/plans`, () =>
      HttpResponse.json({ planId: aGeneration().planId, generationId: aGeneration().id }),
    ),
    http.get(`${API_URL}/v1/plan-generations/current`, () =>
      HttpResponse.json({ generations: [] }),
    ),
  );
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
  it("scrolls the full width, so the day picker's outline is never cut off at the ends", () => {
    render(<NewPlanScreen />);

    const scroll = screen.getByTestId("new-plan-screen-scroll");
    // Nothing around it pads it in from the screen's sides.
    expect(screen.getByTestId("new-plan-screen")).not.toHaveStyle({
      paddingHorizontal: PAGE_INSET,
    });
    expect(scroll).not.toHaveStyle({ paddingHorizontal: PAGE_INSET });
    expect(StyleSheet.flatten(scroll.props.contentContainerStyle as object)).toMatchObject({
      paddingHorizontal: PAGE_INSET,
    });
  });

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

  describe("a link that isn't a link", () => {
    function pressContinueOnBadLink() {
      render(<NewPlanScreen />);
      fireEvent.changeText(screen.getByTestId("paste-sermon-link-input"), "last sunday");
      fireEvent.press(screen.getByTestId("paste-sermon-continue-button"));
    }

    it("says so in a panel at the foot, and stays put", () => {
      pressContinueOnBadLink();

      const panel = screen.getByTestId("new-plan-link-feedback");
      expect(within(panel).getByText("That link won't work")).toBeVisible();
      expect(
        within(panel).getByText("That doesn't look like a link. Try copying it again."),
      ).toBeVisible();
      expect(screen.getByTestId("paste-sermon-body")).toBeVisible();
    });

    it("draws the panel in the incorrect colours", () => {
      pressContinueOnBadLink();

      expect(screen.getByTestId("new-plan-link-feedback")).toHaveStyle({
        backgroundColor: lightTheme.colors.incorrectSurface,
      });
    });

    it("moves Continue into the panel", () => {
      pressContinueOnBadLink();

      const panel = screen.getByTestId("new-plan-link-feedback");
      expect(within(panel).getByTestId("paste-sermon-continue-button")).toBeVisible();
    });

    it("no longer shows the small error under the field", () => {
      pressContinueOnBadLink();

      expect(screen.queryByTestId("paste-sermon-link-input-error")).toBeNull();
    });

    it("keeps the field's edge red while the error stands", () => {
      pressContinueOnBadLink();

      expect(screen.getByTestId("paste-sermon-link-input-field")).toHaveStyle({
        borderColor: lightTheme.colors.accent,
      });
    });

    it("draws the field's edge as a divider when there is no error", () => {
      render(<NewPlanScreen />);

      expect(screen.getByTestId("paste-sermon-link-input-field")).toHaveStyle({
        borderColor: lightTheme.colors.divider,
      });
    });

    it("removes the panel when the link is changed, leaving Continue", () => {
      pressContinueOnBadLink();

      fireEvent.changeText(screen.getByTestId("paste-sermon-link-input"), "last sunday!");

      expect(screen.queryByTestId("new-plan-link-feedback")).toBeNull();
      expect(screen.getByTestId("paste-sermon-continue-button")).toBeVisible();
    });
  });

  describe("a link that works", () => {
    function typeValidLink() {
      render(<NewPlanScreen />);
      fireEvent.changeText(screen.getByTestId("paste-sermon-link-input"), LINK);
    }

    it("says so in a green panel before Continue is pressed", () => {
      typeValidLink();

      const panel = screen.getByTestId("new-plan-link-feedback");
      expect(panel).toHaveStyle({ backgroundColor: lightTheme.colors.correctSurface });
      expect(within(panel).getByText("Nice find!")).toBeVisible();
      expect(
        within(panel).getByText("Let's turn this sermon into your daily study."),
      ).toBeVisible();
    });

    it("moves Continue into the panel", () => {
      typeValidLink();

      const panel = screen.getByTestId("new-plan-link-feedback");
      expect(within(panel).getByTestId("paste-sermon-continue-button")).toBeVisible();
    });

    it("shows the panel without a haptic", () => {
      typeValidLink();

      expect(successFeedback).not.toHaveBeenCalled();
      expect(tapFeedback).not.toHaveBeenCalled();
      expect(selectionFeedback).not.toHaveBeenCalled();
      expect(errorFeedback).not.toHaveBeenCalled();
    });

    it("still moves on to the preview when Continue is pressed in the panel", async () => {
      typeValidLink();

      fireEvent.press(screen.getByTestId("paste-sermon-continue-button"));

      expect(await screen.findByTestId("link-preview-sermon")).toBeVisible();
    });
  });

  it("shows no panel for a link that isn't valid yet, before Continue", () => {
    render(<NewPlanScreen />);

    fireEvent.changeText(screen.getByTestId("paste-sermon-link-input"), "last sunday");

    expect(screen.queryByTestId("new-plan-link-feedback")).toBeNull();
    const dock = screen.getByTestId("new-plan-screen-dock");
    expect(within(dock).getByTestId("paste-sermon-continue-button")).toBeVisible();
  });

  it("puts Continue in the dock, where the tab bar's pill sits, when there is no error", () => {
    render(<NewPlanScreen />);

    const dock = screen.getByTestId("new-plan-screen-dock");
    expect(within(dock).getByTestId("paste-sermon-continue-button")).toBeVisible();
    expect(dock).toHaveStyle({ bottom: getFloatingNavBarBottom(0) });
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
    expect(screen.getByText(aSermon().title)).toBeVisible();
    expect(screen.getByText("…/watch?v=vNoO3YQAPNM")).toBeVisible();
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

  it("closes New Plan when Create my plan is pressed, leaving the build to the generation bar", async () => {
    render(<NewPlanScreen />);
    await goToLinkPreview();

    fireEvent.press(screen.getByTestId("link-preview-create-plan-button"));

    expect(mockExitModal).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("puts sparkles on Create my plan, and nothing on Continue", async () => {
    render(<NewPlanScreen />);
    expect(
      within(screen.getByTestId("paste-sermon-continue-button")).UNSAFE_queryByType(Sparkles),
    ).toBeNull();

    await goToLinkPreview();

    expect(
      within(screen.getByTestId("link-preview-create-plan-button")).UNSAFE_getByType(Sparkles),
    ).toBeTruthy();
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
