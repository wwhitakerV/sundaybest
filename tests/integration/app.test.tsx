import { renderApp, screen } from "@tests/helpers/render";

describe("app routes", () => {
  it("renders the welcome screen at / for a reader not yet onboarded", async () => {
    renderApp();

    expect(await screen.findByTestId("welcome-screen")).toBeVisible();
  });

  it("mounts / as the initial route", () => {
    // Kept as the result object: destructuring getPathname detaches it from
    // its `this` (@typescript-eslint/unbound-method).
    const view = renderApp();

    expect(view.getPathname()).toBe("/");
  });
});
