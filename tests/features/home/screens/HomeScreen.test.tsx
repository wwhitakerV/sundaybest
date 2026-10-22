import { act, render, screen, fireEvent, waitFor, within } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { aPlan } from "@tests/factories/api-plans";
import { servePlans } from "@tests/mocks/plans-api";
import { studyHref } from "@/entities/plan";
import { openShareSheet } from "@/core/sharing/share-sheet";
import { HomeScreen } from "@/features/home/screens/HomeScreen";
import { ScrollToTopProvider, useScrollToTop } from "@/ui/organisms/status-bar/scroll-to-top";
import { forgetLikedVerses } from "@tests/mocks/liked-verses";
import { lightTheme } from "@/theme/tokens";
import { flags } from "@/core/config/flags";
import * as tabBarAccessory from "@/ui/organisms/tab-bar/tab-bar-accessory";
import { space } from "@/theme";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { ScrollView, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

jest.mock("@/core/storage/liked-verses", () =>
  jest.requireActual<object>("@tests/mocks/liked-verses"),
);

jest.mock("@/core/sharing/share-sheet", () => ({
  openShareSheet: jest.fn(() => Promise.resolve()),
  snapshotPng: jest.fn(() => Promise.resolve(null)),
}));

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  // Home's shown — so the status bar may follow its plan bar.
  useIsFocused: () => true,
}));

// Each test waits up to 10s for Home's plans (see `renderHome`); a full
// parallel run can take one past Jest's 5s default.
jest.setTimeout(20_000);

const mockPush = jest.fn<void, [ExpoRouter.Href]>();

/** "Today I Choose to Be a Blessing", under way: six days, day 1 done, day 2 today. */
const ACTIVE = aPlan({
  seed: 1,
  title: "Today I Choose to Be a Blessing",
  church: "VOUS Church",
  lengthDays: 6,
  completedDays: 1,
  thumbnailColors: ["#3d403f", "#1f5a6e", "#1c1d20"],
});
/** A plan the reader has finished. */
const FINISHED = aPlan({ seed: 2, title: "Break the Cycle", status: "completed", lengthDays: 7 });
/** The sample, for a reader with none of their own. */
const SAMPLE = aPlan({
  seed: 9,
  title: "The Church Must Not Partner with the World",
  status: "ready",
  isSample: true,
  lengthDays: 5,
});

/** Home, once these plans have arrived. */
/**
 * A shipped build: no state preview, so the header carries its date. (Tests
 * run as a development build, where the preview takes the date's place.)
 */
function shippedBuild() {
  const real = flags.isEnabled.bind(flags);
  jest
    .spyOn(flags, "isEnabled")
    .mockImplementation((flag) => flag !== "homePreviews" && real(flag));
}

afterEach(() => jest.restoreAllMocks());

async function renderHome(plans: Parameters<typeof servePlans>[0] = [ACTIVE, FINISHED, SAMPLE]) {
  servePlans(plans);
  render(<HomeScreen />);
  await waitFor(() => expect(screen.queryByTestId("home-content-pending")).toBeNull(), {
    timeout: 10000,
  });
}

beforeEach(() => {
  mockPush.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

describe("HomeScreen", () => {
  it("is addressable as home-tab-screen", () => {
    servePlans([ACTIVE]);
    render(<HomeScreen />);

    expect(screen.getByTestId("home-tab-screen")).toBeVisible();
  });

  it("shows the wordmark", () => {
    servePlans([ACTIVE]);
    render(<HomeScreen />);

    expect(screen.getByLabelText("SundayBest")).toBeVisible();
  });

  it("shows its plans' shape while they're on their way", () => {
    servePlans([ACTIVE]);
    render(<HomeScreen />);

    expect(screen.getByTestId("home-content-pending")).toBeOnTheScreen();
  });

  it("lets its content scroll up over the fixed header, not under it", () => {
    servePlans([ACTIVE]);
    render(<HomeScreen />);

    // A scroll view clips its content to its own frame unless told not to;
    // unclipped, content scrolled past its top keeps drawing over the header.
    expect(screen.getByTestId("home-tab-scroll")).toHaveStyle({ overflow: "visible" });
  });

  it("leaves snapping a let-go collapse to iOS — free above it and below it", () => {
    servePlans([ACTIVE]);
    render(<HomeScreen />);

    const scroll = screen.getByTestId("home-tab-scroll");
    expect(scroll).toHaveProp("snapToStart", false);
    expect(scroll).toHaveProp("snapToEnd", false);
  });

  describe("for a newcomer, with no plans of their own", () => {
    it("gives them one page of words: no hero, no verse, no sample", async () => {
      await renderHome([SAMPLE]);

      expect(screen.getByTestId("home-onboarding")).toBeOnTheScreen();
      expect(screen.queryByTestId("home-tab-start-here")).toBeNull();
      expect(screen.queryByTestId("home-verse")).toBeNull();
      expect(screen.queryByText(SAMPLE.title)).toBeNull();
      expect(screen.queryByText(/sample/i)).toBeNull();
    });

    it("says what SundayBest is, what a day holds, and what to do", async () => {
      await renderHome([SAMPLE]);

      const page = within(screen.getByTestId("home-onboarding"));
      expect(
        page.getByText("SundayBest turns a sermon into a few minutes of study each day."),
      ).toBeVisible();
      expect(
        page.getByText(
          "Each day brings a reading, the Scripture behind it, a question to sit with, and a prayer, so what you heard stays with you.",
        ),
      ).toBeVisible();
      expect(page.getByText("Start with a sermon you want to remember.")).toBeVisible();
    });

    it("never guesses when they heard the sermon", async () => {
      await renderHome([SAMPLE]);

      expect(screen.queryByText(/last Sunday/i)).toBeNull();
    });

    it("has one button, Add a sermon, under its words", async () => {
      await renderHome([SAMPLE]);

      const page = within(screen.getByTestId("home-onboarding"));
      const add = screen.getByTestId("home-tab-add-sermon-button");
      const buttons = page.getAllByRole("button");
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toBe(add);
      expect(add).toHaveAccessibleName("Add a sermon");
      const order = screen
        .getAllByTestId(/^home-(onboarding-words|tab-add-sermon-button)$/)
        .map((element) => String(element.props.testID));
      expect(order).toEqual(["home-onboarding-words", "home-tab-add-sermon-button"]);
    });

    it("opens New Plan when Add a sermon is pressed", async () => {
      await renderHome([SAMPLE]);

      fireEvent.press(screen.getByTestId("home-tab-add-sermon-button"));

      expect(mockPush).toHaveBeenCalledWith("/(plan-creation)/paste-sermon");
    });

    it("sets its words low on the page, above the button, as a note is", async () => {
      await renderHome([SAMPLE]);

      expect(screen.getByTestId("home-onboarding")).toHaveStyle({ justifyContent: "flex-end" });
    });

    it("asks the tab bar to leave out its plus: the page's own button does just that", async () => {
      const hide = jest.spyOn(tabBarAccessory, "useHideTabBarFab");
      await renderHome([SAMPLE]);

      expect(hide).toHaveBeenLastCalledWith(true);
    });
  });

  describe("with plans, but none under way", () => {
    it("shows the start hero in the plan's place, on the brand's red", async () => {
      await renderHome([FINISHED]);

      expect(screen.getByTestId("home-tab-start-here")).toHaveStyle({
        backgroundColor: lightTheme.colors.accent,
        paddingTop: 52,
        paddingBottom: 40,
      });
      expect(screen.queryByTestId("home-onboarding")).toBeNull();
    });

    it("sets its words in white on the red, its button white", async () => {
      await renderHome([FINISHED]);

      const hero = within(screen.getByTestId("home-tab-start-here"));
      expect(hero.getByText("Turn a sermon into daily study")).toHaveStyle({
        color: lightTheme.colors.inkOnDark,
      });
      expect(screen.getByTestId("home-tab-add-sermon-button")).toHaveStyle({
        backgroundColor: lightTheme.colors.background,
      });
    });

    it("says where they are, and how to begin", async () => {
      await renderHome([FINISHED]);

      const hero = within(screen.getByTestId("home-tab-start-here"));
      expect(hero.getByText("START HERE")).toBeVisible();
      expect(hero.getByText("Search for it, or paste its link.")).toBeVisible();
    });

    it("navigates to New Plan when Add a sermon is pressed", async () => {
      await renderHome([FINISHED]);

      fireEvent.press(screen.getByTestId("home-tab-add-sermon-button"));

      expect(mockPush).toHaveBeenCalledWith("/(plan-creation)/paste-sermon");
    });

    it("keeps the tab bar's plus", async () => {
      const hide = jest.spyOn(tabBarAccessory, "useHideTabBarFab");
      await renderHome([FINISHED]);

      expect(hide).toHaveBeenLastCalledWith(false);
    });
  });

  describe("with a plan under way", () => {
    it("features it at the top, full width, in its sermon's colours", async () => {
      await renderHome();

      expect(screen.getByTestId("home-tab-active-hero")).toHaveStyle({
        backgroundColor: "#3d403f",
      });
      expect(screen.getByTestId("home-tab-active-hero-backdrop")).toBeOnTheScreen();
    });

    it("gives the colour room to breathe above and below the plan — below, as Plan Detail does", async () => {
      await renderHome();

      expect(screen.getByTestId("home-tab-active-hero")).toHaveStyle({
        paddingTop: 52,
        paddingBottom: 40,
      });
    });

    it("puts the plan in context: where it stands, its title, and its church", async () => {
      await renderHome();

      expect(screen.getByTestId("home-tab-active-plan-status")).toHaveTextContent(
        "IN PROGRESS · DAY 2 OF 6",
      );
      const hero = within(screen.getByTestId("home-tab-active-hero"));
      expect(hero.getByText("Today I Choose to Be a Blessing")).toBeVisible();
      expect(hero.getByText("VOUS Church")).toBeVisible();
    });

    it("says what today's study is, and about how long it takes", async () => {
      await renderHome();

      expect(screen.getByTestId("home-tab-active-plan-today")).toHaveTextContent(
        "Today: Day 2 reading · 9 min",
      );
    });

    it("sets its words in white on a dark colour", async () => {
      await renderHome();

      const hero = within(screen.getByTestId("home-tab-active-hero"));
      expect(hero.getByText("Today I Choose to Be a Blessing")).toHaveStyle({
        color: lightTheme.colors.inkOnDark,
      });
    });

    it("continues with today's day from its button", async () => {
      await renderHome();

      fireEvent.press(screen.getByTestId("home-tab-continue-button"));

      expect(mockPush).toHaveBeenCalledWith(studyHref(ACTIVE.id, 2));
    });

    it("opens the plan from its artwork, saying where the plan stands", async () => {
      await renderHome();

      expect(screen.getByTestId("home-tab-active-plan")).toHaveAccessibleName(
        "Today I Choose to Be a Blessing, day 2 of 6. 1 of 6 days done.",
      );
    });

    it("stands in a quiet colour for a sermon whose colours aren't known yet", async () => {
      await renderHome([{ ...ACTIVE, sermon: { ...ACTIVE.sermon, thumbnailColors: [] } }]);

      expect(screen.getByTestId("home-tab-active-hero")).toHaveStyle({
        backgroundColor: lightTheme.colors.featureBackdrop,
      });
    });

    it("keeps the plan bar ready at rest, but out of the way — hidden, taking no taps", async () => {
      await renderHome();

      expect(screen.getByTestId("home-tab-plan-bar")).toHaveProp("pointerEvents", "none");
      expect(screen.getByTestId("home-tab-plan-bar")).toHaveTextContent(/Day 2/);
      expect(screen.getByTestId("home-tab-header")).toHaveProp("pointerEvents", "auto");
    });

    it("shows the day the server says the plan is on", async () => {
      await renderHome([aPlan({ seed: 1, title: ACTIVE.title, lengthDays: 6, completedDays: 2 })]);

      expect(screen.getByTestId("home-tab-active-plan-status")).toHaveTextContent(
        "IN PROGRESS · DAY 3 OF 6",
      );
      expect(screen.getByTestId("home-tab-continue-button")).toHaveAccessibleName("Continue Day 3");
      expect(screen.getByTestId("home-tab-active-plan")).toHaveAccessibleName(
        "Today I Choose to Be a Blessing, day 3 of 6. 2 of 6 days done.",
      );
    });
  });

  it("lets the date give way before the masthead when the header is tight", async () => {
    shippedBuild();
    servePlans([ACTIVE]);
    render(<HomeScreen />);

    expect(await screen.findByTestId("home-tab-date")).toHaveStyle({ flexShrink: 1 });
  });

  it("dates its header beside the masthead, as 09.30.26 in the mono", () => {
    shippedBuild();
    servePlans([ACTIVE]);
    render(<HomeScreen />);

    expect(screen.getByTestId("home-tab-date")).toHaveTextContent(/^\d{2}\.\d{2}\.\d{2}$/);
    expect(screen.getByTestId("home-tab-date")).toHaveStyle(lightTheme.typography.headerDate);
  });
});

describe("HomeScreen's verse of the day", () => {
  // Monday 19 October 2026: Colossians 3:13.
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-19T10:00:00"), advanceTimers: true });
    jest.mocked(openShareSheet).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const card = () => screen.getByTestId("home-verse");

  it("sits below the plan card", async () => {
    await renderHome();

    const order = screen
      .getAllByTestId(/^home-(tab-active-hero|verse)$/)
      .map((element) => String(element.props.testID));
    expect(order).toEqual(["home-tab-active-hero", "home-verse"]);
  });

  it("names itself in red, with no paint: the wordmark's is the page's one stroke", async () => {
    await renderHome();

    expect(within(card()).getByText("Verse of the day")).toHaveStyle({
      color: lightTheme.colors.accent,
    });
    expect(screen.queryByTestId("home-verse-content-label")).toBeNull();
  });

  it("shows the verse, where it's from, and the day it's for", async () => {
    await renderHome();

    expect(within(card()).getByText(/^Bear with one another and forgive/)).toBeOnTheScreen();
    expect(within(card()).getByText("Colossians 3:13 · BSB")).toBeOnTheScreen();
    expect(within(card()).getByText("Monday, October 19")).toBeOnTheScreen();
  });

  it("closes on the day's line, beneath its heart and share", async () => {
    await renderHome();

    const caption = "Forgive without pretending the trust was never broken.";
    expect(within(card()).queryByText(caption)).toBeNull();
    expect(within(screen.getByTestId("home-verse-caption")).getByText(caption)).toBeOnTheScreen();
    const order = screen
      .getAllByTestId(/^home-verse-(actions|caption)$/)
      .map((element) => String(element.props.testID));
    expect(order).toEqual(["home-verse-actions", "home-verse-caption"]);
  });

  it("stands well apart from the plan card above it", async () => {
    await renderHome();

    expect(screen.getByTestId("home-verse-section")).toHaveStyle({ marginTop: space[28] });
  });

  it("sits on the page as part of it, with no card or edge around it", async () => {
    await renderHome();

    expect(card()).not.toHaveStyle({ borderWidth: 1 });
    expect(card()).not.toHaveStyle({ backgroundColor: lightTheme.colors.surface });
  });

  it("is itself a way to share it, named for that", async () => {
    await renderHome();

    expect(card()).toHaveProp("accessibilityRole", "button");
    expect(card()).toHaveAccessibleName("Verse of the day, Colossians 3:13. Share");
  });

  it("opens iOS's share sheet with the verse when it's tapped", async () => {
    await renderHome();

    fireEvent.press(card());

    await waitFor(() =>
      expect(openShareSheet).toHaveBeenCalledWith({
        message: expect.stringContaining("Colossians 3:13 (BSB)") as string,
        png: null,
      }),
    );
  });

  it("has a heart and a share beneath it, side by side", async () => {
    await renderHome();

    const actions = within(screen.getByTestId("home-verse-actions"));
    expect(actions.getByRole("button", { name: "Like" })).toBeOnTheScreen();
    expect(actions.getByRole("button", { name: "Share" })).toBeOnTheScreen();
  });

  it("shares from its share button", async () => {
    await renderHome();

    fireEvent.press(screen.getByRole("button", { name: "Share" }));

    await waitFor(() => expect(openShareSheet).toHaveBeenCalledTimes(1));
  });

  it("is liked with its heart, which then says so", async () => {
    forgetLikedVerses();
    await renderHome();
    const heart = () => screen.getByTestId("home-verse-actions-like");
    await waitFor(() => expect(heart()).not.toBeSelected());

    fireEvent.press(heart());

    await waitFor(() => expect(heart()).toBeSelected());
  });

  it("draws its share card off the screen, signed with the wordmark, unseen by VoiceOver", async () => {
    await renderHome();

    // Hidden from VoiceOver, so found only when hidden elements are asked for.
    const share = screen.getByTestId("home-verse-share-card", { includeHiddenElements: true });
    expect(share).toHaveProp("accessibilityElementsHidden", true);
    expect(share).toHaveProp("importantForAccessibility", "no-hide-descendants");
    expect(
      within(share).getByTestId("home-verse-share-card-wordmark", { includeHiddenElements: true }),
    ).toBeOnTheScreen();
    expect(screen.queryByTestId("home-verse-share-card")).toBeNull();
  });

  it("keeps its share card wholly past the screen's edge, the page's inset and all", async () => {
    await renderHome();

    const share = screen.getByTestId("home-verse-share-card", { includeHiddenElements: true });
    const { left, width } = StyleSheet.flatten(share.props.style as StyleProp<ViewStyle>) as {
      left: number;
      width: number;
    };
    expect(left + width).toBeLessThanOrEqual(-PAGE_INSET);
  });
});

describe("HomeScreen and the status bar", () => {
  afterEach(() => jest.restoreAllMocks());

  it("scrolls Home back to its top when the status bar is tapped, as iOS's does", async () => {
    const scrollTo = jest.spyOn(ScrollView.prototype, "scrollTo");
    let tapBar: () => void = () => undefined;
    function Bar() {
      tapBar = useScrollToTop();
      return null;
    }
    servePlans([ACTIVE, FINISHED, SAMPLE]);
    render(
      <ScrollToTopProvider>
        <HomeScreen />
        <Bar />
      </ScrollToTopProvider>,
    );
    await waitFor(() => expect(screen.queryByTestId("home-content-pending")).toBeNull(), {
      timeout: 10000,
    });

    act(() => tapBar());

    expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: true });
  });
});

describe("HomeScreen's state preview (development builds)", () => {
  it("starts on the real Home and steps to the next state when tapped", async () => {
    await renderHome();

    const preview = () => screen.getByTestId("home-preview");
    expect(preview()).toHaveAccessibleName("Preview: Real");

    fireEvent.press(preview());

    expect(screen.getByTestId("home-content-pending")).toBeOnTheScreen();
    expect(preview()).toHaveAccessibleName("Preview: Loading");
  });

  it("keeps the switcher on the error page, so it can step on", async () => {
    await renderHome();

    fireEvent.press(screen.getByTestId("home-preview"));
    fireEvent.press(screen.getByTestId("home-preview"));

    expect(screen.getByTestId("home-load-error")).toBeOnTheScreen();
    expect(screen.getByTestId("home-preview")).toHaveAccessibleName("Preview: Couldn't load");
  });
});
