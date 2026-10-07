import { StatusBar } from "react-native";
import { http, HttpResponse } from "msw";
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL, someSettings } from "@tests/factories/api";
import { aPlan } from "@tests/factories/api-plans";
import { servePlans } from "@tests/mocks/plans-api";
import {
  clearSavedAnswers,
  saveReflectionAnswer,
  savedAnswers,
} from "@tests/mocks/reflection-answers";
import { server } from "@tests/mocks/server";
import type { ApiPlanDetail } from "@/core/api/contracts";
import { dayCompleteHref, quickCheckHref } from "@/entities/plan";
import { READING_PAPERS } from "@/theme";
import { darkTheme, lightTheme } from "@/theme/tokens";
import { StudyScreen } from "@/features/plans/screens/StudyScreen";

jest.mock("@/core/storage/reflection-answers", () =>
  jest.requireActual<object>("@tests/mocks/reflection-answers"),
);

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
  useLocalSearchParams: jest.fn<{ planId: string; day: string }, []>(),
}));

// These walk a whole quiz or study day through the API; a full parallel run
// can take them past Jest's 5s default.
jest.setTimeout(20_000);

const mockReplace = jest.fn<void, [ExpoRouter.Href]>();
const mockExitSession = jest.fn<void, []>();

/** Three days, none done: day 1 open, its reading with a moment in the sermon to hear. */
const STILL_PRAYING = (() => {
  const plan = aPlan({ seed: 2, title: "Still Praying", completedDays: 0 });
  return {
    ...plan,
    days: plan.days.map((day) =>
      day.dayNumber === 1
        ? {
            ...day,
            reading: { ...day.reading, sermonClip: { startSeconds: 640, endSeconds: null } },
          }
        : day,
    ),
  };
})();
/** The same, made without Quick Checks. */
const NO_QUIZ = aPlan({ seed: 3, completedDays: 0, quickCheckEnabled: false });

const READING = "The reading for day 1.";
const FIRST_QUESTION = "Question 1 for day 1?";
const SECOND_QUESTION = "Question 2 for day 1?";
const firstReflection = (plan: ApiPlanDetail) => plan.days[0]?.reflectionPrompts[0]?.id ?? "";

/** Day 1's Daily Study, once it's loaded, under these reading settings. */
async function openStudy(
  plan: ApiPlanDetail = STILL_PRAYING,
  settings: Parameters<typeof someSettings>[0] = {},
) {
  const seen = servePlans([plan]);
  server.use(
    http.get(`${API_URL}/v1/me/settings`, () =>
      HttpResponse.json({ settings: someSettings(settings) }),
    ),
  );
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId: plan.id, day: "1" });
  render(<StudyScreen />);
  await screen.findByTestId("study-read-body", undefined, { timeout: 10000 });
  return seen;
}

/** The reader's settings changes sent, in order; each answers with the change made. */
function serveSettingsChanges() {
  const sent: unknown[] = [];
  server.use(
    http.patch(`${API_URL}/v1/me/settings`, async ({ request }) => {
      const body = (await request.json()) as object;
      sent.push(body);
      return HttpResponse.json({ settings: someSettings(body) });
    }),
  );
  return sent;
}

const press = (testID: string) => fireEvent.press(screen.getByTestId(testID));

async function goToStep(step: "scripture" | "reflect" | "pray") {
  const order = ["scripture", "reflect", "pray"];
  for (const next of order.slice(0, order.indexOf(step) + 1)) {
    if (next === "pray") {
      // Reflect asks two questions, a page each.
      press("study-nav-next-button");
      await screen.findByText(SECOND_QUESTION);
    }
    press("study-nav-next-button");
    await screen.findByTestId(`study-${next}-body`);
  }
}

beforeEach(() => {
  clearSavedAnswers();
  mockReplace.mockClear();
  mockExitSession.mockClear();
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitSession }),
  });
  jest
    .mocked(useRouter)
    .mockReturnValue({ replace: mockReplace } as unknown as ReturnType<typeof useRouter>);
});

describe("StudyScreen", () => {
  it("is addressable as study-screen", async () => {
    await openStudy();

    expect(screen.getByTestId("study-screen")).toBeVisible();
  });

  it("shows the study's shape while the day is on its way", () => {
    servePlans([STILL_PRAYING]);
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: STILL_PRAYING.id, day: "1" });
    render(<StudyScreen />);

    expect(screen.getByTestId("study-content-pending")).toBeOnTheScreen();
  });

  it("says so for a day the plan doesn't have, with the way out of the session", async () => {
    servePlans([STILL_PRAYING]);
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: STILL_PRAYING.id, day: "6" });
    render(<StudyScreen />);

    expect(
      await screen.findByRole("header", { name: "This day isn’t here" }, { timeout: 10000 }),
    ).toBeVisible();
    press("study-not-found-action");
    expect(mockExitSession).toHaveBeenCalledTimes(1);
  });

  it("shows the day context in the header", async () => {
    await openStudy();

    expect(screen.getByText("Day 1 of 3")).toBeVisible();
  });

  describe("Read", () => {
    it("starts on the day's reading", async () => {
      await openStudy();

      expect(screen.getByText("Day 1 reading")).toBeVisible();
      expect(screen.getByText("Idea 1")).toBeVisible();
      expect(screen.getByText(READING)).toBeVisible();
    });

    it("points to where the reading comes from in the sermon", async () => {
      await openStudy();

      expect(screen.getByText("Hear this part of the sermon")).toBeVisible();
      expect(screen.getByText("Starts at 10:40")).toBeVisible();
    });
  });

  describe("Scripture", () => {
    it("shows the day's passage: its reference, translation, and verses", async () => {
      await openStudy();

      await goToStep("scripture");

      expect(screen.getByText("John 3:1")).toBeVisible();
      expect(screen.getByText("BSB")).toBeVisible();
      expect(screen.getByTestId("study-scripture-verses")).toHaveTextContent(
        /For God so loved the world/,
      );
    });
  });

  describe("Reflect", () => {
    it("asks one question a page, starting with the first", async () => {
      await openStudy();

      await goToStep("reflect");

      expect(screen.getByText("Question 1 of 2")).toBeVisible();
      expect(screen.getByText(FIRST_QUESTION)).toBeVisible();
      expect(screen.queryByText(SECOND_QUESTION)).toBeNull();
    });

    it("turns to the next question on Next, still on Reflect", async () => {
      await openStudy();
      await goToStep("reflect");

      press("study-nav-next-button");

      expect(await screen.findByText(SECOND_QUESTION)).toBeVisible();
      expect(screen.getByText("Question 2 of 2")).toBeVisible();
      expect(screen.queryByText(FIRST_QUESTION)).toBeNull();
    });

    it("fills Reflect's part of the progress line to the question it's on", async () => {
      await openStudy();
      await goToStep("reflect");

      expect(screen.getByTestId("study-progress-segment-2-fill")).toHaveStyle({ width: "50%" });
      press("study-nav-next-button");
      await screen.findByText("Question 2 of 2");

      expect(screen.getByTestId("study-progress-segment-2-fill")).toHaveStyle({ width: "100%" });
    });

    it("goes on to Pray after the last question, and back to it from Pray", async () => {
      await openStudy();
      await goToStep("pray");

      press("study-nav-prev-button");

      expect(await screen.findByText("Question 2 of 2")).toBeVisible();
    });

    it("shows an answer already written on this device", async () => {
      await saveReflectionAnswer("me", firstReflection(STILL_PRAYING), "Written before");
      await openStudy();

      await goToStep("reflect");

      expect(screen.getByTestId("study-reflect-answer-1").props.value).toBe("Written before");
    });

    it("keeps an answer typed, moving between steps", async () => {
      await openStudy();
      await goToStep("reflect");

      fireEvent.changeText(screen.getByTestId("study-reflect-answer-1"), "The move, mostly.");
      press("study-nav-prev-button");
      await screen.findByTestId("study-scripture-body");
      press("study-nav-next-button");
      await screen.findByTestId("study-reflect-body");

      expect(screen.getByTestId("study-reflect-answer-1").props.value).toBe("The move, mostly.");
    });

    it("saves an answer on this device as it's typed — never to the server", async () => {
      const seen = await openStudy();
      await goToStep("reflect");

      fireEvent.changeText(screen.getByTestId("study-reflect-answer-1"), "The move, mostly.");

      await waitFor(() =>
        expect(savedAnswers().get(firstReflection(STILL_PRAYING))).toBe("The move, mostly."),
      );
      expect(JSON.stringify(seen)).not.toContain("The move, mostly.");
    });

    it("clears an answer the reader has emptied", async () => {
      await saveReflectionAnswer("me", firstReflection(STILL_PRAYING), "Written before");
      await openStudy();
      await goToStep("reflect");

      fireEvent.changeText(screen.getByTestId("study-reflect-answer-1"), "");

      await waitFor(() => expect(savedAnswers().has(firstReflection(STILL_PRAYING))).toBe(false));
    });
  });

  describe("Pray", () => {
    it("shows the day's prayer", async () => {
      await openStudy();

      await goToStep("pray");

      expect(screen.getByText("Lord, day 1. Amen.")).toBeVisible();
      // Inside StudyNav, which Jest's Reanimated mock leaves at its opacity-0
      // opening frame — assert presence, not visibility.
      expect(screen.getByText("Finish")).toBeOnTheScreen();
    });
  });

  describe("working through the day", () => {
    const stepsRecorded = (seen: { method: string; path: string }[]) =>
      seen
        .filter(({ method, path }) => method === "PUT" && path.includes("/steps/"))
        .map(({ path }) => path.split("/").at(-1));

    it("records each step as it's done", async () => {
      const seen = await openStudy();

      await goToStep("scripture");

      expect(stepsRecorded(seen)).toEqual(["read"]);
    });

    it("doesn't complete the day by reaching the last step — only Finish does", async () => {
      const seen = await openStudy(NO_QUIZ);

      await goToStep("pray");

      expect(seen.filter(({ path }) => path.endsWith("/complete"))).toHaveLength(0);
    });

    it("completes the day on Finish, prayer prayed, and opens Day Complete for it", async () => {
      const seen = await openStudy(NO_QUIZ);
      await goToStep("pray");

      press("study-nav-next-button");

      await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(dayCompleteHref(NO_QUIZ.id, 1)));
      expect(stepsRecorded(seen)).toEqual(["read", "scripture", "reflect", "pray"]);
      expect(seen).toContainEqual(
        expect.objectContaining({
          method: "POST",
          path: `/v1/plans/${NO_QUIZ.id}/days/1/complete`,
        }),
      );
    });

    it("opens the day's Quick Check on Finish, the day not yet complete", async () => {
      const seen = await openStudy();
      await goToStep("pray");

      press("study-nav-next-button");

      await waitFor(() =>
        expect(mockReplace).toHaveBeenCalledWith(quickCheckHref(STILL_PRAYING.id, 1)),
      );
      expect(seen.filter(({ path }) => path.endsWith("/complete"))).toHaveLength(0);
    });
  });

  describe("navigation", () => {
    it("keeps the header mounted across a step change", async () => {
      await openStudy();

      const header = screen.getByTestId("study");
      press("study-nav-next-button");
      await screen.findByTestId("study-scripture-body");

      expect(screen.getByTestId("study")).toBe(header);
    });

    it("keeps the nav mounted across a step change", async () => {
      await openStudy();

      const nav = screen.getByTestId("study-nav");
      press("study-nav-next-button");
      await screen.findByTestId("study-scripture-body");

      expect(screen.getByTestId("study-nav")).toBe(nav);
    });

    it("goes back a step when Previous is pressed after Scripture", async () => {
      await openStudy();
      await goToStep("scripture");

      press("study-nav-prev-button");

      expect(await screen.findByTestId("study-read-body")).toBeVisible();
      expect(mockExitSession).not.toHaveBeenCalled();
    });

    it("dismisses the whole flow when the close button is pressed", async () => {
      await openStudy();
      await goToStep("scripture");

      press("study-close-button");

      expect(mockExitSession).toHaveBeenCalledTimes(1);
    });

    it("exits when Previous is pressed on Read", async () => {
      await openStudy();

      press("study-nav-prev-button");

      expect(mockExitSession).toHaveBeenCalledTimes(1);
    });
  });

  describe("reading sheet", () => {
    const nightBackground = () => READING_PAPERS.find((paper) => paper.id === "night")?.background;

    it("is closed until the text-size button is pressed", async () => {
      await openStudy();

      expect(screen.queryByTestId("study-reading-sheet")).toBeNull();
      press("study-text-size-button");

      expect(screen.getByTestId("study-reading-sheet")).toBeVisible();
    });

    it("closes when its scrim is tapped", async () => {
      await openStudy();
      press("study-text-size-button");

      fireEvent.press(
        screen.getByTestId("study-reading-sheet-scrim", { includeHiddenElements: true }),
      );

      expect(screen.queryByTestId("study-reading-sheet")).toBeNull();
    });

    it("makes the reading's text bigger at once, and saves it, when the scale is increased", async () => {
      const sent = serveSettingsChanges();
      await openStudy();
      const base = lightTheme.typography.reading.fontSize;
      expect(screen.getByText(READING)).toHaveStyle({ fontSize: base });
      press("study-text-size-button");

      press("study-reading-text-size-increase");

      await waitFor(() => expect(screen.getByText(READING)).toHaveStyle({ fontSize: base + 2 }));
      await waitFor(() => expect(sent).toEqual([{ readingTextOffset: 2 }]));
    });

    it("makes the reading's text smaller when the scale is decreased", async () => {
      serveSettingsChanges();
      await openStudy();
      const base = lightTheme.typography.reading.fontSize;
      press("study-text-size-button");

      press("study-reading-text-size-decrease");

      await waitFor(() => expect(screen.getByText(READING)).toHaveStyle({ fontSize: base - 2 }));
    });

    it("turns the page to Night: that paper behind it, light text on it", async () => {
      const sent = serveSettingsChanges();
      await openStudy();
      press("study-text-size-button");

      press("study-reading-paper-night");

      await waitFor(() =>
        expect(screen.getByTestId("study-screen")).toHaveStyle({
          backgroundColor: nightBackground(),
        }),
      );
      expect(screen.getByText(READING)).toHaveStyle({ color: darkTheme.colors.textInactive });
      await waitFor(() => expect(sent).toEqual([{ readingPaper: "night" }]));
    });
  });

  describe("reading settings beyond the page", () => {
    it("keeps the header title at its designed size when the text is made larger", async () => {
      await openStudy(STILL_PRAYING, { readingTextOffset: 4 });

      expect(screen.getByText("Day 1 of 3")).toHaveStyle({
        fontSize: lightTheme.typography.navTitle.fontSize,
      });
      expect(screen.getByText(READING)).toHaveStyle({
        fontSize: lightTheme.typography.reading.fontSize + 4,
      });
    });

    it("lights the status bar text on Night paper", async () => {
      await openStudy(STILL_PRAYING, { readingPaper: "night" });

      expect(screen.UNSAFE_getByType(StatusBar).props.barStyle).toBe("light-content");
    });

    it("leaves the status bar alone on a light paper", async () => {
      await openStudy(STILL_PRAYING, { readingPaper: "white" });

      expect(screen.UNSAFE_queryByType(StatusBar)).toBeNull();
    });
  });

  describe("the step tracker follows the paper", () => {
    async function onScripture(readingPaper: "night" | "white") {
      await openStudy(STILL_PRAYING, { readingPaper });
      await goToStep("scripture");
    }

    it("draws a done segment in the Night paper's text colour", async () => {
      await onScripture("night");

      expect(screen.getByTestId("study-progress-segment-0")).toHaveStyle({
        backgroundColor: darkTheme.colors.text,
      });
    });

    it("draws an upcoming segment in the Night paper's divider colour", async () => {
      await onScripture("night");

      expect(screen.getByTestId("study-progress-segment-3")).toHaveStyle({
        backgroundColor: darkTheme.colors.divider,
      });
    });

    it("draws the same on a light paper in the light text and divider colours", async () => {
      await onScripture("white");

      expect(screen.getByTestId("study-progress-segment-0")).toHaveStyle({
        backgroundColor: lightTheme.colors.text,
      });
      expect(screen.getByTestId("study-progress-segment-3")).toHaveStyle({
        backgroundColor: lightTheme.colors.divider,
      });
    });
  });
});
