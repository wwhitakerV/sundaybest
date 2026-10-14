import { renderHook } from "@tests/helpers/render";
import { useNavigation } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { useModalSession } from "@/hooks/use-modal-session";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useNavigation: jest.fn(),
}));

/** The app's own stack, with these screens in it, the last on top. */
function underApp(...names: string[]) {
  const dispatch = jest.fn();
  const app = {
    getState: () => ({ index: names.length - 1, routes: names.map((name) => ({ name })) }),
    dispatch,
  };
  jest
    .mocked(useNavigation)
    .mockReturnValue({ getParent: () => app } as unknown as ReturnType<typeof useNavigation>);
  return dispatch;
}

describe("useModalSession", () => {
  it("slides the modal down to the screen that opened it", () => {
    const dispatch = underApp("(tabs)", "study");
    const { result } = renderHook(() => useModalSession());

    result.current.exit();

    expect(dispatch).toHaveBeenCalledWith({ type: "POP", payload: { count: 1 } });
  });

  it("takes what it was opened over with it, in the one slide (New Plan over a finished study)", () => {
    const dispatch = underApp("(tabs)", "study", "(plan-creation)");
    const { result } = renderHook(() => useModalSession({ alsoLeaving: ["study", "generation"] }));

    result.current.exit();

    expect(dispatch).toHaveBeenCalledWith({ type: "POP", payload: { count: 2 } });
  });

  it("leaves what it wasn't opened over where it is", () => {
    const dispatch = underApp("(tabs)", "weeks", "(plan-creation)");
    const { result } = renderHook(() => useModalSession({ alsoLeaving: ["study", "generation"] }));

    result.current.exit();

    expect(dispatch).toHaveBeenCalledWith({ type: "POP", payload: { count: 1 } });
  });
});
