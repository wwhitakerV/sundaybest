import { stackRootReset } from "@/ui/organisms/tab-bar/stack-root-reset";

type Tab = Parameters<typeof stackRootReset>[0]["routes"][number];

const tabs = (settings: Omit<Tab, "key" | "name">) => {
  const home: Tab = { key: "home-1", name: "home" };
  return {
    key: "tabs-1",
    index: 1,
    routes: [home, { key: "settings-1", name: "settings", ...settings }],
  };
};

const settingsOnly = {
  key: "settings-1",
  name: "settings",
  state: { routes: [{ name: "index" }] },
};

describe("stackRootReset", () => {
  it("puts a tab back on its first page when its stack starts elsewhere", () => {
    const state = tabs({ state: { routes: [{ name: "daily-reminder" }] } });

    expect(stackRootReset(state, "settings-1")).toEqual({
      type: "RESET",
      target: "tabs-1",
      payload: { ...state, routes: [state.routes[0], settingsOnly] },
    });
  });

  it("does the same for a tab only just opened on a page without its first one underneath", () => {
    const state = tabs({ params: { screen: "daily-reminder", params: {} } });

    expect(stackRootReset(state, "settings-1")?.payload.routes[1]).toEqual(settingsOnly);
  });

  it("leaves a tab whose stack starts on its first page to iOS's own pop to the top", () => {
    expect(
      stackRootReset(
        tabs({ state: { routes: [{ name: "index" }, { name: "text-size" }] } }),
        "settings-1",
      ),
    ).toBeNull();
  });

  it("leaves a tab just opened with its first page underneath (`withAnchor`)", () => {
    const state = tabs({ params: { screen: "daily-reminder", initial: false } });

    expect(stackRootReset(state, "settings-1")).toBeNull();
  });

  it("leaves a tab opened on its first page, or not opened at all", () => {
    expect(stackRootReset(tabs({ params: { screen: "index" } }), "settings-1")).toBeNull();
    expect(stackRootReset(tabs({}), "settings-1")).toBeNull();
  });

  it("leaves a tab it can't find", () => {
    expect(stackRootReset(tabs({}), "missing")).toBeNull();
  });
});
