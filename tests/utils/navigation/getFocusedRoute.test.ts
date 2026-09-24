import { getFocusedRoute } from "@/utils/navigation/getFocusedRoute";

describe("getFocusedRoute", () => {
  it("follows the focused route down every navigator, naming the whole way", () => {
    const state = {
      index: 1,
      routes: [
        { key: "welcome-1", name: "index" },
        {
          key: "tabs-1",
          name: "(tabs)",
          state: {
            index: 0,
            routes: [
              {
                key: "home-1",
                name: "home",
                state: {
                  index: 1,
                  routes: [
                    { key: "index-1", name: "index" },
                    { key: "plan-1", name: "[planId]" },
                  ],
                },
              },
              { key: "fun-1", name: "fun" },
            ],
          },
        },
      ],
    };

    expect(getFocusedRoute(state)).toEqual({ key: "plan-1", path: "(tabs)/home/[planId]" });
  });

  it("stops at a navigator that hasn't been opened yet", () => {
    const state = { index: 0, routes: [{ key: "fun-1", name: "fun" }] };

    expect(getFocusedRoute(state)).toEqual({ key: "fun-1", path: "fun" });
  });

  it("takes the first route when a navigator's state doesn't say which is focused", () => {
    const state = {
      routes: [
        { key: "home-1", name: "home" },
        { key: "fun-1", name: "fun" },
      ],
    };

    expect(getFocusedRoute(state)).toEqual({ key: "home-1", path: "home" });
  });

  it("finds nothing before there's any navigation state", () => {
    expect(getFocusedRoute(undefined)).toBeUndefined();
  });

  it("finds nothing when the focused route has no key yet", () => {
    expect(getFocusedRoute({ index: 0, routes: [{ name: "home" }] })).toBeUndefined();
  });
});
