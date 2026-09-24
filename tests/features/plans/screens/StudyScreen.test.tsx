import { Text } from "react-native";
import { render, screen, fireEvent } from "@tests/helpers/render";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import {
  AppStoreProvider,
  INITIAL_STATE,
  getPlanDays,
  getPlanProgress,
  getPrayerForDay,
  getReflectionsForDay,
  useAppSelector,
  type AppState,
} from "@/core/store";
import { StudyScreen } from "@/features/plans/screens/StudyScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
  useLocalSearchParams: jest.fn<{ planId: string; day: string }, []>(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockReplace = jest.fn<void, [ExpoRouter.Href]>();
const mockExitSession = jest.fn<void, []>();
const mockBack = jest.fn<void, []>();

// Ready, not started: three days, day 1 open.
const STORM = "plan-faith-through-the-storm";
// Under way: six days, day 1 done, day 2 today (Read and Scripture done, one answer written).
const ACTIVE = "plan-choose-whom-you-will-serve";

/** What the store holds for a plan: each day's status, and how many are done. */
function PlanProbe({ planId }: { planId: string }) {
  const days = useAppSelector((state) =>
    getPlanDays(state, planId)
      .map((day) => `${day.dayNumber}:${day.status}:${day.completedSteps.join("+")}`)
      .join(" "),
  );
  const done = useAppSelector((state) => getPlanProgress(state, planId)?.completedDayCount);
  return <Text testID="plan-probe">{`${days} | ${String(done)} done`}</Text>;
}

/** What the store holds for one day's answers and prayer. */
function DayProbe({ planId, dayNumber }: { planId: string; dayNumber: number }) {
  const dayId = `${planId}-day-${dayNumber}`;
  const answers = useAppSelector((state) =>
    getReflectionsForDay(state, dayId)
      .map((reflection) => reflection.answer ?? "–")
      .join(" / "),
  );
  const prayed = useAppSelector((state) => getPrayerForDay(state, dayId)?.prayedAt !== null);
  return <Text testID="day-probe">{`${answers} | ${prayed ? "prayed" : "not prayed"}`}</Text>;
}

/** The study (open or closed) beside the probes, all over one store. */
function studyTree(planId: string, day: number, state: AppState, open = true) {
  return (
    <AppStoreProvider initialState={state}>
      {open && <StudyScreen />}
      <PlanProbe planId={planId} />
      <DayProbe planId={planId} dayNumber={day} />
    </AppStoreProvider>
  );
}

function renderStudy(planId: string, day: number, state: AppState = INITIAL_STATE) {
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId, day: String(day) });
  return render(studyTree(planId, day, state));
}

async function goToStep(step: "scripture" | "reflect" | "pray") {
  const order = ["scripture", "reflect", "pray"];
  for (const next of order.slice(0, order.indexOf(step) + 1)) {
    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId(`study-${next}-body`);
  }
}

beforeEach(() => {
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitSession }),
  });
  jest.mocked(useRouter).mockReturnValue({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  } as unknown as ReturnType<typeof useRouter>);
});

describe("StudyScreen", () => {
  it("is addressable as study-screen", () => {
    renderStudy(STORM, 1);

    expect(screen.getByTestId("study-screen")).toBeVisible();
  });

  it("shows nothing for a day the plan doesn't have", () => {
    renderStudy(STORM, 9);

    expect(screen.queryByTestId("study-screen")).toBeNull();
  });

  it("shows the day context in the header", () => {
    renderStudy(STORM, 1);

    expect(screen.getByText("Day 1 of 3")).toBeVisible();
  });

  describe("Read", () => {
    it("starts on the day's reading", () => {
      renderStudy(STORM, 1);

      expect(screen.getByTestId("study-read-body")).toBeVisible();
      expect(screen.getByText("Asleep in the boat")).toBeVisible();
      expect(
        screen.getByText(
          "The disciples were in a storm with Jesus in the boat — and He was asleep.",
        ),
      ).toBeVisible();
    });

    it("points to where the reading comes from in the sermon", () => {
      renderStudy(STORM, 1);

      expect(screen.getByText("Hear this part of the sermon")).toBeVisible();
      expect(screen.getByText("Starts at 10:40")).toBeVisible();
    });
  });

  describe("Scripture", () => {
    it("shows the day's passage: its reference, translation, and verses", async () => {
      renderStudy(STORM, 1);

      await goToStep("scripture");

      expect(screen.getByText("Mark 4:39")).toBeVisible();
      expect(screen.getByText("NIV")).toBeVisible();
      expect(screen.getByTestId("study-scripture-verses")).toHaveTextContent(
        /He got up, rebuked the wind/,
      );
    });

    it("reads in the user's chosen translation where the passage is there in it", async () => {
      const kjv = {
        ...INITIAL_STATE,
        settings: { ...INITIAL_STATE.settings, bibleTranslation: "KJV" },
      };
      renderStudy(ACTIVE, 2, kjv as AppState);

      await goToStep("scripture");

      expect(screen.getByText("KJV")).toBeVisible();
      expect(screen.getByTestId("study-scripture-verses")).toHaveTextContent(
        /For by grace are ye saved through faith/,
      );
    });
  });

  describe("Reflect", () => {
    it("asks one question a page, starting with the first", async () => {
      renderStudy(ACTIVE, 2);

      await goToStep("reflect");

      expect(screen.getByText("Question 1 of 2")).toBeVisible();
      expect(screen.getByText("What are you still trying to pay for?")).toBeVisible();
      expect(screen.queryByText("Where did you see grace this week?")).toBeNull();
    });

    it("turns to the next question on Next, still on Reflect", async () => {
      renderStudy(ACTIVE, 2);
      await goToStep("reflect");

      fireEvent.press(screen.getByTestId("study-nav-next-button"));

      expect(await screen.findByText("Where did you see grace this week?")).toBeVisible();
      expect(screen.getByText("Question 2 of 2")).toBeVisible();
      expect(screen.queryByText("What are you still trying to pay for?")).toBeNull();
    });

    it("fills Reflect's part of the progress line to the question it's on", async () => {
      renderStudy(ACTIVE, 2);
      await goToStep("reflect");

      expect(screen.getByTestId("study-progress-segment-2-fill")).toHaveStyle({ width: "50%" });
      fireEvent.press(screen.getByTestId("study-nav-next-button"));
      await screen.findByText("Question 2 of 2");

      expect(screen.getByTestId("study-progress-segment-2-fill")).toHaveStyle({ width: "100%" });
    });

    it("goes on to Pray after the last question, and back to it from Pray", async () => {
      renderStudy(ACTIVE, 2);
      await goToStep("reflect");
      fireEvent.press(screen.getByTestId("study-nav-next-button"));
      await screen.findByText("Question 2 of 2");

      fireEvent.press(screen.getByTestId("study-nav-next-button"));
      await screen.findByTestId("study-pray-body");
      fireEvent.press(screen.getByTestId("study-nav-prev-button"));

      expect(await screen.findByText("Question 2 of 2")).toBeVisible();
    });

    it("saves an answer the user has emptied as cleared", async () => {
      renderStudy(ACTIVE, 2);
      await goToStep("reflect");

      fireEvent.changeText(screen.getByTestId("study-reflect-answer-1"), "");
      fireEvent.press(screen.getByTestId("study-nav-next-button"));

      expect(screen.getByTestId("day-probe")).toHaveTextContent("– / – | not prayed");
    });

    it("shows an answer already written", async () => {
      renderStudy(ACTIVE, 2);

      await goToStep("reflect");

      expect(screen.getByTestId("study-reflect-answer-1").props.value).toMatch(/\S/);
    });

    it("keeps an answer typed, moving between steps", async () => {
      renderStudy(STORM, 1);
      await goToStep("reflect");

      fireEvent.changeText(screen.getByTestId("study-reflect-answer-1"), "The move, mostly.");
      fireEvent.press(screen.getByTestId("study-nav-prev-button"));
      await screen.findByTestId("study-scripture-body");
      fireEvent.press(screen.getByTestId("study-nav-next-button"));
      await screen.findByTestId("study-reflect-body");

      expect(screen.getByTestId("study-reflect-answer-1").props.value).toBe("The move, mostly.");
    });

    it("saves the answer to the day on leaving the step", async () => {
      renderStudy(STORM, 1);
      await goToStep("reflect");

      fireEvent.changeText(screen.getByTestId("study-reflect-answer-1"), "The move, mostly.");
      fireEvent.press(screen.getByTestId("study-nav-next-button"));

      expect(screen.getByTestId("day-probe")).toHaveTextContent(/^The move, mostly\. \|/);
    });

    it("still has the answer after leaving the study and coming back", async () => {
      const view = renderStudy(STORM, 1);
      await goToStep("reflect");
      fireEvent.changeText(screen.getByTestId("study-reflect-answer-1"), "The move, mostly.");
      fireEvent.press(screen.getByTestId("study-close-button"));

      // The study closes and opens again; the store stays.
      view.rerender(studyTree(STORM, 1, INITIAL_STATE, false));
      view.rerender(studyTree(STORM, 1, INITIAL_STATE, true));
      await goToStep("reflect");

      expect(screen.getByTestId("study-reflect-answer-1").props.value).toBe("The move, mostly.");
    });
  });

  describe("Pray", () => {
    it("shows the day's prayer", async () => {
      renderStudy(STORM, 1);

      await goToStep("pray");

      expect(screen.getByText("A prayer for today")).toBeVisible();
      expect(
        screen.getByText(
          "Jesus, You're in the boat with me. Speak Your peace over what feels out of control. Amen.",
        ),
      ).toBeVisible();
      // Inside StudyNav, which Jest's Reanimated mock leaves at its opacity-0
      // opening frame — assert presence, not visibility.
      expect(screen.getByText("Finish")).toBeOnTheScreen();
    });
  });

  describe("working through the day", () => {
    it("records each step as it's done, starting the day", async () => {
      renderStudy(STORM, 1);

      await goToStep("scripture");

      expect(screen.getByTestId("plan-probe")).toHaveTextContent(
        "1:inProgress:read 2:locked: 3:locked: | 0 done",
      );
    });

    it("doesn't complete the day by reaching the last step — only Finish does", async () => {
      renderStudy(STORM, 1);

      await goToStep("pray");

      expect(screen.getByTestId("plan-probe")).toHaveTextContent(/\| 0 done$/);
    });

    it("completes the day on Finish: done, progress moved on, and the next day open", async () => {
      renderStudy(STORM, 1);
      await goToStep("pray");

      fireEvent.press(screen.getByTestId("study-nav-next-button"));

      expect(screen.getByTestId("plan-probe")).toHaveTextContent(
        "1:completed:read+scripture+reflect+pray 2:available: 3:locked: | 1 done",
      );
    });

    it("marks the prayer prayed on Finish", async () => {
      renderStudy(STORM, 1);
      await goToStep("pray");

      fireEvent.press(screen.getByTestId("study-nav-next-button"));

      expect(screen.getByTestId("day-probe")).toHaveTextContent(/\| prayed$/);
    });

    it("opens Day Complete for the same day on Finish", async () => {
      renderStudy(STORM, 1);
      await goToStep("pray");

      fireEvent.press(screen.getByTestId("study-nav-next-button"));

      expect(mockReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: "/study/[planId]/day-complete",
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
          params: expect.objectContaining({ planId: STORM, day: "1" }),
        }),
      );
    });
  });

  describe("navigation", () => {
    it("keeps the header mounted across a step change", () => {
      renderStudy(STORM, 1);

      const header = screen.getByTestId("study");
      fireEvent.press(screen.getByTestId("study-nav-next-button"));

      expect(screen.getByTestId("study")).toBe(header);
    });

    it("keeps the nav mounted across a step change", () => {
      renderStudy(STORM, 1);

      const nav = screen.getByTestId("study-nav");
      fireEvent.press(screen.getByTestId("study-nav-next-button"));

      expect(screen.getByTestId("study-nav")).toBe(nav);
    });

    it("goes back a step when Previous is pressed after Scripture", async () => {
      renderStudy(STORM, 1);
      await goToStep("scripture");

      fireEvent.press(screen.getByTestId("study-nav-prev-button"));

      expect(await screen.findByTestId("study-read-body")).toBeVisible();
      expect(mockExitSession).not.toHaveBeenCalled();
    });

    it("dismisses the whole flow when the close button is pressed", async () => {
      renderStudy(STORM, 1);
      await goToStep("scripture");

      fireEvent.press(screen.getByTestId("study-close-button"));

      expect(mockExitSession).toHaveBeenCalledTimes(1);
    });

    it("exits when Previous is pressed on Read", () => {
      renderStudy(STORM, 1);

      fireEvent.press(screen.getByTestId("study-nav-prev-button"));

      expect(mockExitSession).toHaveBeenCalledTimes(1);
    });
  });
});
