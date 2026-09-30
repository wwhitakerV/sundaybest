import { render, screen, fireEvent } from "@tests/helpers/render";
import { useLocalSearchParams } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { openPassageLink } from "@/core/links/open-passage-link";
import { ExamTopicsScreen } from "@/features/exams";
import { theologyExam } from "@tests/factories/exam-state";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useLocalSearchParams: jest.fn(),
}));

jest.mock("@/core/links/open-passage-link", () => ({
  openPassageLink: jest.fn().mockResolvedValue("closed"),
}));

const { exam } = theologyExam();

beforeEach(() => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ examId: "THEO-01-01" });
});

describe("ExamTopicsScreen", () => {
  it("is headed Topics covered", () => {
    render(<ExamTopicsScreen />);

    expect(screen.getByTestId("exam-topics-sheet")).toBeVisible();
    expect(screen.getByRole("header")).toHaveTextContent("Topics covered");
  });

  it("lists each topic the exam explores, in order", () => {
    render(<ExamTopicsScreen />);

    exam.summary.explore.forEach((item, index) => {
      expect(screen.getByTestId(`exam-topics-${index}`)).toHaveTextContent(item.title);
    });
  });

  it("opens the passage a topic is explored in", () => {
    render(<ExamTopicsScreen />);

    fireEvent.press(screen.getByTestId("exam-topics-1"));

    expect(openPassageLink).toHaveBeenCalledWith(exam.summary.explore[1]!.passage.url);
  });

  it("says so when it hasn't the exam", () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ examId: "THEO-99-99" });
    render(<ExamTopicsScreen />);

    expect(screen.getByTestId("exam-topics-unavailable")).toBeVisible();
  });
});
