import type { SharedValue } from "react-native-reanimated";
import { renderHook } from "@tests/helpers/render";

import { buttonSpring, useTabBarMinimize } from "@/ui/organisms/tab-bar/use-tab-bar-minimize";

describe("the tab bar button's spring", () => {
  it("bounces into place as the button comes in", () => {
    expect(buttonSpring(true).overshootClamping).toBeFalsy();
  });

  it("never swings past hidden as it leaves, so it can't flash back into view", () => {
    expect(buttonSpring(false).overshootClamping).toBe(true);
  });
});

describe("the capsule and the floating button's room", () => {
  const ROOM = 76;

  function capsule(taken: number) {
    return renderHook(() =>
      useTabBarMinimize(false, false, 300, 54, {
        room: ROOM,
        taken: { value: taken } as SharedValue<number>,
      }),
    ).result.current.capsuleStyle;
  }

  it("leaves the floating button its room while it's there", () => {
    expect(capsule(0)).toMatchObject({ width: 300, marginRight: ROOM });
  });

  it("takes the button's room once it's gone: the tabs run the bar's full width", () => {
    expect(capsule(1)).toMatchObject({ width: 300 + ROOM, marginRight: 0 });
  });
});
