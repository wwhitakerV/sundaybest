import { fireEvent, render, screen } from "@tests/helpers/render";

import { ApiError } from "@/core/api/api-error";
import { StudyNotFound } from "@/features/plans/components/StudyNotFound";

const mockExit = jest.fn();
jest.mock("@/hooks/use-modal-session", () => ({
  useModalSession: () => ({ exit: mockExit, exitTo: jest.fn() }),
}));

beforeEach(() => mockExit.mockClear());

describe("StudyNotFound", () => {
  it("says a day isn't open yet, and closes the study back to where it was opened", () => {
    render(<StudyNotFound testID="study-not-found" error={new ApiError("DAY_LOCKED", 409)} />);

    expect(screen.getByRole("header", { name: "This day isn't open yet" })).toBeVisible();
    fireEvent.press(screen.getByRole("button", { name: "Close" }));
    expect(mockExit).toHaveBeenCalledTimes(1);
  });

  it("offers to try again when the server couldn't be reached, with Close beside it", () => {
    const retry = jest.fn();
    render(<StudyNotFound testID="study-not-found" error={new Error("offline")} onRetry={retry} />);

    expect(screen.getByRole("header", { name: "Couldn't load this study" })).toBeVisible();
    expect(screen.getByText(/SundayBest couldn't reach your study/)).toBeVisible();
    fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByRole("button", { name: "Close" }));
    expect(mockExit).toHaveBeenCalledTimes(1);
  });

  it("says a missing day isn't here, and closes", () => {
    render(<StudyNotFound testID="study-not-found" />);

    expect(screen.getByRole("header", { name: "This day isn't here" })).toBeVisible();
    fireEvent.press(screen.getByRole("button", { name: "Close" }));
    expect(mockExit).toHaveBeenCalledTimes(1);
  });
});
