import { getFocusedPlace } from "@/utils/navigation/getFocusedPlace";

const tabs = (index: number) => ({
  name: "(tabs)",
  state: { index, routes: [{ name: "home" }, { name: "plans" }, { name: "progress" }] },
});

const PLACES = ["plan-search", "weeks"] as const;

describe("getFocusedPlace", () => {
  it("names the tab in focus when nothing's over the tabs", () => {
    expect(
      getFocusedPlace({ index: 1, routes: [{ name: "index" }, tabs(2)] }, "(tabs)", PLACES),
    ).toBe("progress");
  });

  it("names a place over the tabs that has its own pages (Plans' search)", () => {
    const state = { index: 2, routes: [{ name: "index" }, tabs(1), { name: "plan-search" }] };

    expect(getFocusedPlace(state, "(tabs)", PLACES)).toBe("plan-search");
  });

  it("names the place under a screen with no pages of its own (a study over Weeks)", () => {
    const state = {
      index: 3,
      routes: [{ name: "index" }, tabs(2), { name: "weeks" }, { name: "study" }],
    };

    expect(getFocusedPlace(state, "(tabs)", PLACES)).toBe("weeks");
  });

  it("names the tab under a screen with no pages of its own (a study over a tab)", () => {
    const state = { index: 2, routes: [{ name: "index" }, tabs(1), { name: "study" }] };

    expect(getFocusedPlace(state, "(tabs)", PLACES)).toBe("plans");
  });

  it("finds its places inside the router's own root navigator", () => {
    const state = {
      routes: [
        {
          name: "__root",
          state: { index: 2, routes: [{ name: "index" }, tabs(0), { name: "weeks" }] },
        },
      ],
    };

    expect(getFocusedPlace(state, "(tabs)", PLACES)).toBe("weeks");
  });

  it("is null before the tabs are there at all (Welcome)", () => {
    expect(getFocusedPlace({ index: 0, routes: [{ name: "index" }] }, "(tabs)", PLACES)).toBeNull();
  });

  it("is null with no navigation state yet", () => {
    expect(getFocusedPlace(undefined, "(tabs)", PLACES)).toBeNull();
  });
});
