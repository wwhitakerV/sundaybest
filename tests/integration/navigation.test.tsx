import { renderApp, screen, fireEvent } from "@tests/helpers/render";

/**
 * Proves the route tree actually wires together end to end — not just that
 * each screen renders in isolation (every screen already has its own test
 * for that), but that pressing a real button on one screen lands on the
 * next real screen, repeatedly, through a full flow.
 *
 * Every scenario starts at `/` and navigates in-app via real button presses
 * rather than `renderRouter`'s `initialUrl` option: `initialUrl` is treated
 * as an inbound deep link and passes through
 * `src/app/+native-intent.tsx` -> `validateDeepLink`, whose allowlist is
 * deliberately just `/` and `/index` (see
 * `src/core/security/deep-links/validate-deep-link.ts`) — a security
 * decision about what can be reached from *outside* the app, left
 * untouched here. In-app `router.push()` navigation is not gated by it.
 */
describe("navigation", () => {
  it("walks Welcome -> Home tab -> Paste Sermon -> Link Preview -> Preparing -> Plan Ready", async () => {
    const view = renderApp();

    expect(view.getPathname()).toBe("/");
    fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));

    expect(view.getPathname()).toBe("/home");
    fireEvent.press(screen.getByTestId("tab-bar-fab"));

    expect(view.getPathname()).toBe("/paste-sermon");
    fireEvent.press(screen.getByTestId("paste-sermon-continue-button"));

    // New Plan's two steps change in place — the route stays put.
    fireEvent.press(await screen.findByTestId("link-preview-create-plan-button"));

    expect(view.getPathname()).toBe("/preparing");
    fireEvent.press(screen.getByTestId("preparing-plan-continue-button"));

    expect(view.getPathname()).toBe("/ready");
    expect(screen.getByTestId("plan-ready-start-button")).toBeVisible();

    // "Start day 1" -> Read is covered by PlanReadyScreen.test.tsx, with a
    // mocked router: it awaits the stubbed notification-permission request
    // before navigating, and that pending promise does not resolve reliably
    // under renderApp()'s forced fake timers in this harness. This test's
    // job is proving the route chain up to Plan Ready wires together: the
    // async branch past it is exercised at the unit level instead.
  });

  it("walks Welcome -> Plan Overview for the sample plan", () => {
    const view = renderApp();

    fireEvent.press(screen.getByTestId("welcome-sample-plan-button"));

    expect(view.getPathname()).toBe("/plans/sample-plan");
    expect(screen.getByTestId("plan-overview-screen")).toBeVisible();
  });

  it("walks Plan Overview -> Read -> Scripture -> Reflect -> Pray -> Day Complete for a mocked plan", async () => {
    const view = renderApp();

    fireEvent.press(screen.getByTestId("welcome-sample-plan-button"));
    expect(screen.getByTestId("plan-overview-screen")).toBeVisible();

    fireEvent.press(screen.getByTestId("plan-overview-continue-button"));
    expect(view.getPathname()).toBe("/study/sample-plan");
    expect(screen.getByTestId("study-read-body")).toBeVisible();

    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-scripture-body");

    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-reflect-body");

    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-pray-body");

    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    expect(view.getPathname()).toBe("/study/sample-plan/day-complete");
    expect(screen.getByTestId("day-complete-screen")).toBeVisible();
  });

  it("walks the Quick Check loop back to Day Complete", async () => {
    const view = renderApp();

    fireEvent.press(screen.getByTestId("welcome-sample-plan-button"));
    fireEvent.press(screen.getByTestId("plan-overview-continue-button"));
    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-scripture-body");
    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-reflect-body");
    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-pray-body");
    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    expect(screen.getByTestId("day-complete-screen")).toBeVisible();

    fireEvent.press(screen.getByTestId("day-complete-quick-check-button"));
    expect(view.getPathname()).toBe("/study/sample-plan/quick-check");

    // Quick Check steps through its stages in place — the route never changes.
    fireEvent.press(screen.getByTestId("quick-check-question-check-answer-button"));
    fireEvent.press(await screen.findByTestId("quick-check-answer-next-question-button"));
    fireEvent.press(await screen.findByTestId("quick-check-finish-verse-check-answer-button"));
    await screen.findByTestId("quick-check-score-body");
    expect(view.getPathname()).toBe("/study/sample-plan/quick-check");

    fireEvent.press(screen.getByTestId("quick-check-score-done-button"));
    expect(view.getPathname()).toBe("/study/sample-plan/day-complete");
  });

  it("round-trips a Settings subpage back to Settings", () => {
    const view = renderApp();

    fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));
    fireEvent.press(screen.getByTestId("home-tab-account-button"));
    expect(view.getPathname()).toBe("/settings");

    fireEvent.press(screen.getByTestId("settings-daily-reminder-row"));
    expect(view.getPathname()).toBe("/settings/daily-reminder");

    fireEvent.press(screen.getByTestId("daily-reminder-back-button"));
    expect(view.getPathname()).toBe("/settings");
  });
});
