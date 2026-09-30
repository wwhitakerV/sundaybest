import { ScrollView } from "react-native";
import { render, screen, fireEvent } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { lightTheme } from "@/theme/tokens";
import { AppStoreProvider, INITIAL_STATE, type AppState } from "@/core/store";
import { withExamAttempt } from "@tests/factories/exam-state";
import { ExamsScreen } from "@/features/exams";
import { examSessionHref, examSubjectHref, examSubjectsHref } from "@/features/exams/logic/routes";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockBack = jest.fn<void, []>();

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({
    push: mockPush,
    back: mockBack,
  } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(useLocalSearchParams).mockReturnValue({});
});

/** The carousel, measured at an iPhone's width and the height left for it, so its books have a size. */
function renderExams(state: AppState = INITIAL_STATE) {
  render(
    <AppStoreProvider initialState={state}>
      <ExamsScreen />
    </AppStoreProvider>,
  );
  fireEvent(screen.getByTestId("exams-carousel"), "layout", {
    nativeEvent: { layout: { x: 0, y: 0, width: 393, height: 480 } },
  });
}

describe("ExamsScreen", () => {
  it("is addressable as exams-screen", () => {
    renderExams();

    expect(screen.getByTestId("exams-screen")).toBeVisible();
  });

  it("is headed Theology Exams, with how many subjects and exams it holds", () => {
    renderExams();

    expect(screen.getByRole("header", { name: "Theology Exams" })).toBeVisible();
    expect(screen.getByTestId("exams-count")).toHaveTextContent("12 subjects · 48 exams");
  });

  it("never scrolls up and down — only its books, across", () => {
    renderExams();

    const scrollers = screen.UNSAFE_getAllByType(ScrollView);
    expect(scrollers).toHaveLength(1);
    expect(scrollers[0]?.props.horizontal).toBe(true);
    expect(screen.queryByTestId("exams-next-subject")).toBeNull();
    expect(screen.queryByTestId("exams-next-button")).toBeNull();
    expect(screen.queryByTestId("exams-previous-button")).toBeNull();
  });

  it("shows every subject's book, made in full, whichever is in view", () => {
    renderExams();

    expect(screen.getByTestId("exams-folio-THEO-01")).toHaveTextContent(
      /01 \/ Scripture & Reading.*Four exams/,
    );
    expect(screen.getByTestId("exams-folio-THEO-02")).toHaveTextContent(
      /02 \/ The Biblical Story.*Four exams/,
    );
    expect(screen.getByTestId("exams-item-THEO-02-01")).toBeOnTheScreen();
  });

  it("binds each book with a dark spine, reaching across to its red line", () => {
    renderExams();

    expect(screen.getByTestId("exams-folio-THEO-01")).toHaveStyle({
      borderLeftWidth: 12,
      borderLeftColor: lightTheme.palette.frostOnDark,
    });
    expect(
      screen.getByTestId("exams-folio-THEO-01-signature", { includeHiddenElements: true }),
    ).toHaveStyle({ left: 0 });
  });

  it("lists each exam in a book, its level above its title", () => {
    renderExams();

    expect(screen.getByTestId("exams-item-THEO-01-01")).toHaveTextContent(
      /foundations.*The Scriptures Received/i,
    );
  });

  it("opens the subject in view when its book is pressed", () => {
    renderExams();

    fireEvent.press(screen.getByTestId("exams-folio-THEO-01"));

    expect(mockPush).toHaveBeenCalledWith(examSubjectHref("THEO-01"));
  });

  it("brings the next book into view when it's pressed, rather than opening it", () => {
    renderExams();

    fireEvent.press(screen.getByTestId("exams-folio-THEO-02"));

    expect(screen.getByTestId("exams-position")).toHaveTextContent("Subject 02 / 12");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("follows a swipe to where it comes to rest — and no further than the last", () => {
    renderExams();

    fireEvent(screen.getByTestId("exams-carousel-scroller"), "momentumScrollEnd", {
      nativeEvent: { contentOffset: { x: 100_000, y: 0 } },
    });

    expect(screen.getByTestId("exams-position")).toHaveTextContent("Subject 12 / 12");
  });

  it("opens every subject in a sheet, from an icon button", () => {
    renderExams();

    expect(screen.getByTestId("exams-all-subjects-button")).toHaveAccessibleName("All subjects");
    fireEvent.press(screen.getByTestId("exams-all-subjects-button"));

    expect(mockPush).toHaveBeenCalledWith(examSubjectsHref);
  });

  it("opens on the subject picked from that sheet", () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ subject: "THEO-05" });
    renderExams();

    expect(screen.getByTestId("exams-position")).toHaveTextContent("Subject 05 / 12");
  });

  it("ignores a subject it doesn't have", () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ subject: "THEO-99" });
    renderExams();

    expect(screen.getByTestId("exams-position")).toHaveTextContent("Subject 01 / 12");
  });

  describe("an exam left under way", () => {
    const underWay = withExamAttempt(INITIAL_STATE, { attemptId: "attempt-open-1" });

    it("offers to continue it, saying which and how far through", () => {
      renderExams(underWay);

      expect(screen.getByTestId("exams-continue")).toHaveTextContent(
        /Continue exam · The Scriptures Received.*0 of 15 answered/,
      );
    });

    it("goes straight back into it", () => {
      renderExams(underWay);

      fireEvent.press(screen.getByTestId("exams-continue"));

      expect(mockPush).toHaveBeenCalledWith(examSessionHref("attempt-open-1"));
    });
  });

  it("offers nothing to continue before an exam's begun", () => {
    renderExams();

    expect(screen.queryByTestId("exams-continue")).toBeNull();
  });

  it("says on each book that it opens", () => {
    renderExams();

    expect(screen.getByTestId("exams-folio-THEO-01-open")).toHaveTextContent("Open subject");
  });

  it("keeps a book's print from growing past what it has room for", () => {
    renderExams();

    expect(screen.getByText("01 / Scripture & Reading")).toHaveProp("maxFontSizeMultiplier", 1.2);
  });

  it("sets the subject in view in the shared kicker", () => {
    renderExams();

    expect(screen.getByTestId("exams-position")).toHaveStyle(lightTheme.typography.kicker);
  });

  it("goes back to Fun", () => {
    renderExams();

    fireEvent.press(screen.getByTestId("exams-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
