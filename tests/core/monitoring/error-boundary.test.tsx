import { render, screen, fireEvent } from "@tests/helpers/render";
import { ErrorBoundary, SuspenseFallback } from "@/core/monitoring/error-boundary";
import type { CrashReporter } from "@/core/monitoring/crash-reporter";

// error-boundary.tsx defaults to the real crash reporter singleton, which
// transitively imports @sentry/react-native. Every test here passes its own
// mock reporter, but the import happens regardless — mock it so the real SDK
// (and the setInterval its tracing integration starts at import time) is
// never touched. See logger.test.ts for the same note.
jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.0.0" }, manifest2: null },
}));

/**
 * Builds a mock `CrashReporter` and hands back its `captureException` mock as
 * its own reference — asserting on `reporter.captureException` directly trips
 * `@typescript-eslint/unbound-method`, since the interface's methods are not
 * `this: void`. See logger.test.ts's `mockReporter` for the same shape.
 */
function mockReporter(): { reporter: CrashReporter; captureException: jest.Mock } {
  const captureException = jest.fn();
  const reporter: CrashReporter = {
    captureException,
    captureMessage: jest.fn(),
    addBreadcrumb: jest.fn(),
  };
  return { reporter, captureException };
}

describe("ErrorBoundary", () => {
  it("renders the neutral recovery screen", () => {
    render(
      <ErrorBoundary
        error={new Error("kaboom")}
        retry={jest.fn()}
        reporter={mockReporter().reporter}
      />,
    );

    expect(screen.getByTestId("error-screen")).toBeVisible();
  });

  it("reports the error to the crash reporter", () => {
    const { reporter, captureException } = mockReporter();
    const error = new Error("kaboom");

    render(<ErrorBoundary error={error} retry={jest.fn()} reporter={reporter} />);

    expect(captureException).toHaveBeenCalledWith(error);
  });

  it("reports only once for the same error across re-renders", () => {
    const { reporter, captureException } = mockReporter();
    const error = new Error("kaboom");

    const { rerender } = render(
      <ErrorBoundary error={error} retry={jest.fn()} reporter={reporter} />,
    );
    rerender(<ErrorBoundary error={error} retry={jest.fn()} reporter={reporter} />);

    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it("calls retry when the recovery action is pressed", () => {
    const retry = jest.fn();

    render(
      <ErrorBoundary
        error={new Error("kaboom")}
        retry={retry}
        reporter={mockReporter().reporter}
      />,
    );
    fireEvent.press(screen.getByTestId("error-screen-retry"));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("falls back to the real crash reporter singleton when none is given", () => {
    // No `reporter` prop — exercises the default parameter, which is how
    // src/app/_layout.tsx actually uses this component. @sentry/react-native
    // is mocked above, so this never reaches the real SDK.
    expect(() =>
      render(<ErrorBoundary error={new Error("kaboom")} retry={jest.fn()} />),
    ).not.toThrow();
    expect(screen.getByTestId("error-screen")).toBeVisible();
  });
});

describe("SuspenseFallback", () => {
  it("renders its own testID", () => {
    render(<SuspenseFallback />);

    expect(screen.getByTestId("suspense-fallback")).toBeVisible();
  });

  it("does not render the error screen's testID", () => {
    render(<SuspenseFallback />);

    expect(screen.queryByTestId("error-screen")).toBeNull();
  });
});
