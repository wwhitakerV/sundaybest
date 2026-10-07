import { renderHook } from "@tests/helpers/render";

import { RAISE_GEOMETRY } from "@/ui/organisms/tab-bar/tab-bar-geometry";
import { useTabBarRaise, type TabBarRaiseState } from "@/ui/organisms/tab-bar/use-tab-bar-raise";

const FAB_DROP = 120;
const AT_REST: TabBarRaiseState = {
  buttonRaised: false,
  fabShrunk: false,
  tintRaised: false,
  fabHidden: false,
};

function raise(state: Partial<TabBarRaiseState>) {
  return renderHook(() =>
    useTabBarRaise({ ...AT_REST, ...state }, { ...RAISE_GEOMETRY, fabDrop: FAB_DROP }),
  ).result.current;
}

describe("useTabBarRaise", () => {
  it("keeps the FAB in place, and the screen's button clear of it, while it's wanted", () => {
    const { fabStyle, slotStyle } = raise({});

    expect(fabStyle).toMatchObject({ opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] });
    expect(slotStyle).toMatchObject({ right: RAISE_GEOMETRY.beside.right });
  });

  it("drops the FAB down out of the bar when a screen has no use for it", () => {
    const { fabStyle } = raise({ fabHidden: true });

    expect(fabStyle).toMatchObject({
      opacity: 0,
      transform: [{ translateY: FAB_DROP }, { scale: 1 }],
    });
  });

  it("lets the screen's button reach the bar's edge once the FAB's gone", () => {
    expect(raise({ fabHidden: true }).slotStyle).toMatchObject({ right: 0 });
  });

  it("moves the FAB up and down only — never sideways", () => {
    const { fabStyle } = raise({ fabHidden: true });

    expect(JSON.stringify(fabStyle)).not.toMatch(/translateX/);
  });
});
