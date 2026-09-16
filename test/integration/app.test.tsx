import { renderApp, screen } from "@test/render";

describe("app routes", () => {
  it("renders the home screen at /", () => {
    renderApp();

    expect(screen.getByTestId("home-screen")).toBeVisible();
  });

  it("mounts / as the initial route", () => {
    // Kept as the result object: destructuring getPathname detaches it from
    // its `this` (@typescript-eslint/unbound-method).
    const view = renderApp();

    expect(view.getPathname()).toBe("/");
  });
});
