import { getFocusedTab } from "@/utils/navigation/getFocusedTab";

const tabs = (index: number, extra: object = {}) => ({
  name: "(tabs)",
  state: { index, routes: [{ name: "home" }, { name: "plans" }, { name: "progress" }] },
  ...extra,
});

describe("getFocusedTab", () => {
  it("names the tab in focus", () => {
    expect(getFocusedTab({ index: 1, routes: [{ name: "index" }, tabs(2)] }, "(tabs)")).toBe(
      "progress",
    );
  });

  it("finds the tabs inside the router's own root navigator", () => {
    const state = {
      routes: [{ name: "__root", state: { index: 1, routes: [{ name: "index" }, tabs(1)] } }],
    };

    expect(getFocusedTab(state, "(tabs)")).toBe("plans");
  });

  it("names the tab under a screen shown over the tabs (a modal, a full-screen list)", () => {
    const state = { index: 2, routes: [{ name: "index" }, tabs(1), { name: "study" }] };

    expect(getFocusedTab(state, "(tabs)")).toBe("plans");
  });

  it("reads the tab being opened when the tabs haven't been drawn yet", () => {
    const state = {
      index: 1,
      routes: [{ name: "index" }, { name: "(tabs)", params: { screen: "home" } }],
    };

    expect(getFocusedTab(state, "(tabs)")).toBe("home");
  });

  it("is null before the tabs are there at all (Welcome)", () => {
    expect(getFocusedTab({ index: 0, routes: [{ name: "index" }] }, "(tabs)")).toBeNull();
  });

  it("is null with no navigation state yet", () => {
    expect(getFocusedTab(undefined, "(tabs)")).toBeNull();
  });

  it("is null when the tabs say nothing about which is open", () => {
    expect(getFocusedTab({ routes: [{ name: "(tabs)", params: {} }] }, "(tabs)")).toBeNull();
  });
});
