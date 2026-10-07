import { render, screen, fireEvent, waitFor, within } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { aPlan } from "@tests/factories/api-plans";
import { servePlans } from "@tests/mocks/plans-api";
import { planOverviewHref, studyHref } from "@/entities/plan";
import { HomeScreen } from "@/features/home/screens/HomeScreen";
import { lightTheme } from "@/theme/tokens";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  // Home's shown — so the status bar may follow its plan bar.
  useIsFocused: () => true,
}));

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

    expect(screen.getByText("SUNDAYBEST")).toBeVisible();
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

  describe("with no plan under way", () => {
    it("offers to add a sermon instead of a plan", async () => {
      await renderHome([SAMPLE]);

      expect(screen.getByText("Start with last Sunday's sermon")).toBeVisible();
      expect(screen.queryByTestId("home-tab-active-plan")).toBeNull();
    });

    it("navigates to New Plan when Add a sermon is pressed", async () => {
      await renderHome([SAMPLE]);

      fireEvent.press(screen.getByTestId("home-tab-add-sermon-button"));

      expect(mockPush).toHaveBeenCalledWith("/(plan-creation)/paste-sermon");
    });

    it("offers the sample plan to try", async () => {
      await renderHome([SAMPLE]);

      expect(screen.getByText("The Church Must Not Partner with the World")).toBeVisible();
      expect(screen.getByText("Sample plan, 5 days")).toBeVisible();
      fireEvent.press(screen.getByTestId("home-tab-sample-plan"));
      expect(mockPush).toHaveBeenCalledWith(planOverviewHref(SAMPLE.id));
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

    it("lists the user's plans, with a finished one marked when it finished", async () => {
      await renderHome();

      expect(screen.getByTestId(`home-tab-plan-${FINISHED.id}`)).toHaveTextContent(
        /Finished Oct 5/,
      );
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
    servePlans([ACTIVE]);
    render(<HomeScreen />);

    expect(await screen.findByTestId("home-tab-date")).toHaveStyle({ flexShrink: 1 });
  });

  it("dates its header beside the masthead, as 09.30.26 in the mono", () => {
    servePlans([ACTIVE]);
    render(<HomeScreen />);

    expect(screen.getByTestId("home-tab-date")).toHaveTextContent(/^\d{2}\.\d{2}\.\d{2}$/);
    expect(screen.getByTestId("home-tab-date")).toHaveStyle(lightTheme.typography.headerDate);
  });
});
