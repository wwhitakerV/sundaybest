import { render, screen, fireEvent } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { ExamSubjectsScreen } from "@/features/exams";
import { theologyExamsSubjectHref } from "@/features/exams/logic/routes";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockDismissTo = jest.fn<void, [ExpoRouter.Href]>();

beforeEach(() => {
  jest
    .mocked(useRouter)
    .mockReturnValue({ dismissTo: mockDismissTo } as unknown as ReturnType<typeof useRouter>);
});

describe("ExamSubjectsScreen", () => {
  it("is headed All subjects", () => {
    render(<ExamSubjectsScreen />);

    expect(screen.getByTestId("exam-subjects-sheet")).toBeVisible();
    expect(screen.getByRole("header")).toHaveTextContent("All subjects");
  });

  it("lists every subject, numbered, in order", () => {
    render(<ExamSubjectsScreen />);

    expect(screen.getByTestId("exam-subjects-THEO-01")).toHaveTextContent(
      /01.*Scripture & Reading/,
    );
    expect(screen.getByTestId("exam-subjects-THEO-02")).toHaveTextContent(/02.*The Biblical Story/);
    expect(screen.getAllByTestId(/^exam-subjects-THEO-\d+$/)).toHaveLength(12);
  });

  it("goes back to the exams page, open on the subject picked", () => {
    render(<ExamSubjectsScreen />);

    fireEvent.press(screen.getByTestId("exam-subjects-THEO-02"));

    expect(mockDismissTo).toHaveBeenCalledWith(theologyExamsSubjectHref("THEO-02"));
  });
});
