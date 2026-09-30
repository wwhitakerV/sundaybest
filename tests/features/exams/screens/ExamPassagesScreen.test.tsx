import { render, screen, fireEvent } from "@tests/helpers/render";
import { useLocalSearchParams } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { openPassageLink } from "@/core/links/open-passage-link";
import { ExamPassagesScreen } from "@/features/exams";
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

describe("ExamPassagesScreen", () => {
  it("is headed Passages", () => {
    render(<ExamPassagesScreen />);

    expect(screen.getByTestId("exam-passages-sheet")).toBeVisible();
    expect(screen.getByRole("header")).toHaveTextContent("Passages");
  });

  it("lists every passage in the exam's source scope, in order", () => {
    render(<ExamPassagesScreen />);

    exam.summary.sourceLinks.forEach((link, index) => {
      expect(screen.getByTestId(`exam-overview-source-link-${index}`)).toHaveTextContent(
        link.reference,
      );
    });
  });

  it("opens a passage when pressed", () => {
    render(<ExamPassagesScreen />);

    fireEvent.press(screen.getByTestId("exam-overview-source-link-0"));

    expect(openPassageLink).toHaveBeenCalledWith(exam.summary.sourceLinks[0]!.url);
  });

  it("says so when it hasn't the exam", () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ examId: "THEO-99-99" });
    render(<ExamPassagesScreen />);

    expect(screen.getByTestId("exam-passages-unavailable")).toBeVisible();
  });
});
