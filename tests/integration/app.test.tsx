import { renderApp, screen } from "@tests/helpers/render";

/** Mounting the whole route tree takes seconds — more under coverage, or a full parallel run. */
const FULL_APP_MOUNT_MS = 20_000;

describe("app routes", () => {
  it(
    "renders the welcome screen at / for a reader not yet onboarded",
    async () => {
      renderApp();

      expect(
        await screen.findByTestId("welcome-screen", undefined, { timeout: 10_000 }),
      ).toBeVisible();
    },
    FULL_APP_MOUNT_MS,
  );

  it("mounts / as the initial route", () => {
    // Kept as the result object: destructuring getPathname detaches it from
    // its `this` (@typescript-eslint/unbound-method).
    const view = renderApp();

    expect(view.getPathname()).toBe("/");
  });
});
