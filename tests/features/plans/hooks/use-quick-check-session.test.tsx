import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import * as haptics from "@/core/haptics/haptics";
import { dayCompleteHref } from "@/entities/plan";
import { AppStoreProvider, getPlanDay, useAppSelector } from "@/core/store";
import { useQuickCheckSession } from "@/features/plans/hooks/use-quick-check-session";

jest.mock("@/core/haptics/haptics", () => ({
  tapFeedback: jest.fn(),
  selectionFeedback: jest.fn(),
  successFeedback: jest.fn(),
  warningFeedback: jest.fn(),
  errorFeedback: jest.fn(),
}));

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const mockReplace = jest.fn<void, [ExpoRouter.Href]>();
const mockDismissTo = jest.fn<void, [ExpoRouter.Href]>();
const mockExitSession = jest.fn<void, []>();
// One day, and a two-question Quick Check not yet taken.
const TEMPTATION = "plan-overcome-temptation";
const STILL_PRAYING = "plan-still-praying";

function wrapper({ children }: { children: ReactNode }) {
  return <AppStoreProvider>{children}</AppStoreProvider>;
}

function renderQuickCheck(params: Record<string, string>) {
  jest.mocked(useLocalSearchParams).mockReturnValue(params);
  return renderHook(
    () => ({
      session: useQuickCheckSession(),
      dayStatus: useAppSelector((state) => getPlanDay(state, params.planId ?? "", 1)?.status),
    }),
    { wrapper },
  );
}

beforeEach(() => {
  mockReplace.mockClear();
  mockDismissTo.mockClear();
  mockExitSession.mockClear();
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitSession }),
  });
  jest.mocked(useRouter).mockReturnValue({
    replace: mockReplace,
    dismissTo: mockDismissTo,
  } as unknown as ReturnType<typeof useRouter>);
});

describe("useQuickCheckSession", () => {
  it("finds nothing for a day without a Quick Check", () => {
    const { result } = renderQuickCheck({ planId: STILL_PRAYING, day: "1" });

    expect(result.current.session.found).toBe(false);
  });

  it("finds nothing for a day the plan doesn't have", () => {
    const { result } = renderQuickCheck({ planId: STILL_PRAYING, day: "9" });

    expect(result.current.session.found).toBe(false);
  });

  it("finds nothing when the day isn't a number", () => {
    const { result } = renderQuickCheck({ planId: TEMPTATION, day: "abc" });

    expect(result.current.session.found).toBe(false);
  });

  it("starts on page 0, offering to start", () => {
    const { result } = renderQuickCheck({ planId: TEMPTATION, day: "1" });

    expect(result.current.session).toMatchObject({
      found: true,
      status: "notStarted",
      page: 0,
      action: { kind: "start" },
    });
  });

  it("moves to the first question on act(start)", () => {
    const { result } = renderQuickCheck({ planId: TEMPTATION, day: "1" });

    act(() => {
      if (result.current.session.found) result.current.session.act(result.current.session.action);
    });

    expect(result.current.session).toMatchObject({
      status: "inProgress",
      page: 1,
      currentIndex: 0,
    });
  });

  it("leaves the whole session on close(), without completing the day or showing Day Complete", () => {
    const { result } = renderQuickCheck({ planId: TEMPTATION, day: "1" });

    act(() => {
      if (result.current.session.found) result.current.session.close();
    });

    expect(mockExitSession).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockDismissTo).not.toHaveBeenCalled();
    expect(result.current.dayStatus).not.toBe("completed");
  });

  it("completes the day and replaces with Day Complete on act(done), after the score", () => {
    const { result } = renderQuickCheck({ planId: TEMPTATION, day: "1" });
    const step = () =>
      act(() => {
        if (result.current.session.found) {
          result.current.session.act(result.current.session.action);
        }
      });
    const pickRight = () =>
      act(() => {
        const { session } = result.current;
        if (session.found && session.current) session.pick(session.current.correctChoiceId);
      });
    step(); // start
    pickRight();
    step(); // check
    step(); // next
    pickRight();
    step(); // check
    step(); // finish
    expect(result.current.session.found && result.current.session.action.kind).toBe("done");
    expect(result.current.dayStatus).not.toBe("completed");

    step(); // done

    expect(result.current.dayStatus).toBe("completed");
    expect(mockReplace).toHaveBeenCalledWith(dayCompleteHref(TEMPTATION, 1));
  });
});

describe("useQuickCheckSession haptics", () => {
  type Session = ReturnType<typeof renderQuickCheck>["result"];

  function act_(result: Session) {
    act(() => {
      if (result.current.session.found) result.current.session.act(result.current.session.action);
    });
  }

  function choices(result: Session) {
    if (!result.current.session.found || !result.current.session.current)
      throw new Error("no question");
    const { choices: all, correctChoiceId } = result.current.session.current;
    const wrong = all.find((choice) => choice.id !== correctChoiceId)?.id ?? "";
    return { correct: correctChoiceId, wrong };
  }

  function pick(result: Session, choiceId: string) {
    act(() => {
      if (result.current.session.found) result.current.session.pick(choiceId);
    });
  }

  it("taps as the Quick Check is started", () => {
    const { result } = renderQuickCheck({ planId: TEMPTATION, day: "1" });

    act_(result);

    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
  });

  it("selects once when a choice is picked, and is silent for the same one again", () => {
    const { result } = renderQuickCheck({ planId: TEMPTATION, day: "1" });
    act_(result);

    pick(result, choices(result).wrong);
    pick(result, choices(result).wrong);

    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);
  });

  it("selects again when a different choice replaces the one picked", () => {
    const { result } = renderQuickCheck({ planId: TEMPTATION, day: "1" });
    act_(result);

    pick(result, choices(result).wrong);
    pick(result, choices(result).correct);

    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(2);
  });

  it("gives success for a correct answer, warning for a wrong one, and success on finishing", () => {
    const { result } = renderQuickCheck({ planId: TEMPTATION, day: "1" });
    act_(result);

    pick(result, choices(result).correct);
    jest.mocked(haptics.tapFeedback).mockClear();
    act_(result);
    expect(result.current.session.found && result.current.session.action.kind).toBe("next");
    expect(haptics.successFeedback).toHaveBeenCalledTimes(1);
    expect(haptics.warningFeedback).not.toHaveBeenCalled();
    expect(haptics.tapFeedback).not.toHaveBeenCalled();

    act_(result); // next
    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);

    pick(result, choices(result).wrong);
    act_(result); // check
    expect(haptics.warningFeedback).toHaveBeenCalledTimes(1);
    expect(haptics.successFeedback).toHaveBeenCalledTimes(1);

    act_(result); // finish
    expect(result.current.session.found && result.current.session.status).toBe("completed");
    expect(haptics.successFeedback).toHaveBeenCalledTimes(2);
  });

  it("gives nothing as the Quick Check is closed", () => {
    const { result } = renderQuickCheck({ planId: TEMPTATION, day: "1" });

    act(() => {
      if (result.current.session.found) result.current.session.close();
    });

    expect(haptics.tapFeedback).not.toHaveBeenCalled();
    expect(haptics.successFeedback).not.toHaveBeenCalled();
  });
});
