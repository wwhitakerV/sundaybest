import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import * as Clipboard from "expo-clipboard";
import { useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import * as haptics from "@/core/haptics/haptics";
import { lookUpMockSermon } from "@/core/plan-builder";
import {
  AppStoreProvider,
  getPlanById,
  getPlans,
  useAppSelector,
  useStoreActions,
} from "@/core/store";
import { useNewPlanFlow } from "@/features/plan-creation/hooks/use-new-plan-flow";

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
  useIsFocused: () => true,
}));

jest.mock("expo-clipboard", () => ({ getStringAsync: jest.fn() }));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockExitModal = jest.fn<void, []>();
const LINK = "https://youtube.com/watch?v=Qm81xRz4";

function wrapper({ children }: { children: ReactNode }) {
  return <AppStoreProvider>{children}</AppStoreProvider>;
}

/** The flow, and the ids of the plans the store holds. */
function useFlowAndPlans() {
  return {
    flow: useNewPlanFlow(),
    failBuild: useStoreActions().failPlanGeneration,
    planIds: useAppSelector((state) => getPlans(state).map((plan) => plan.id)),
    statusOf: useAppSelector(
      (state) => (planId: string) => getPlanById(state, planId)?.status ?? null,
    ),
  };
}

function renderFlow() {
  return renderHook(() => useFlowAndPlans(), { wrapper });
}

/** Types a link and presses Continue, letting the sermon be looked up. */
async function checkLink(result: { current: ReturnType<typeof useFlowAndPlans> }, link: string) {
  act(() => result.current.flow.changeLink(link));
  await act(async () => {
    await Promise.resolve(result.current.flow.next());
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitModal }),
  });
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

describe("useNewPlanFlow", () => {
  it("opens on the paste step, with no link and no error", () => {
    const { result } = renderFlow();

    expect(result.current.flow.stepIndex).toBe(0);
    expect(result.current.flow.state).toMatchObject({ link: "", linkError: null });
  });

  it("holds the link as it's typed", () => {
    const { result } = renderFlow();

    act(() => result.current.flow.changeLink("youtube.com/watch?v=abc"));

    expect(result.current.flow.state).toMatchObject({ link: "youtube.com/watch?v=abc" });
  });

  it("fills the link from the clipboard on paste()", async () => {
    jest.mocked(Clipboard.getStringAsync).mockResolvedValue(LINK);
    const { result } = renderFlow();

    await act(async () => {
      await result.current.flow.paste();
    });

    expect(result.current.flow.state).toMatchObject({ link: LINK });
  });

  it("says so on an invalid link, and stays on the paste step", async () => {
    const { result } = renderFlow();

    await checkLink(result, "last sunday");

    expect(result.current.flow.state).toHaveProperty(
      "linkError",
      "That doesn't look like a link. Try copying it again.",
    );
    expect(result.current.flow.stepIndex).toBe(0);
  });

  it("clears the error once the link is changed", async () => {
    const { result } = renderFlow();
    await checkLink(result, "last sunday");

    act(() => result.current.flow.changeLink("last sunday s"));

    expect(result.current.flow.state).toHaveProperty("linkError", null);
  });

  it("moves to the preview on a valid link", async () => {
    const { result } = renderFlow();

    await checkLink(result, LINK);

    await waitFor(() => expect(result.current.flow.stepIndex).toBe(1));
  });

  it("makes one plan, and opens Preparing for it, on next() from the preview", async () => {
    const { result } = renderFlow();
    const before = result.current.planIds;
    await checkLink(result, LINK);
    await waitFor(() => expect(result.current.flow.stepIndex).toBe(1));

    await act(async () => {
      await Promise.resolve(result.current.flow.next());
    });

    const created = result.current.planIds.filter((id) => !before.includes(id));
    expect(created).toHaveLength(1);
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(plan-creation)/preparing",
      params: { planId: created.at(0) },
    });
  });

  it("leaves the flow on leading() from the paste step", () => {
    const { result } = renderFlow();

    act(() => result.current.flow.leading());

    expect(mockExitModal).toHaveBeenCalledTimes(1);
  });

  it("steps back to the paste step on leading() from the preview", async () => {
    const { result } = renderFlow();
    await checkLink(result, LINK);
    await waitFor(() => expect(result.current.flow.stepIndex).toBe(1));

    act(() => result.current.flow.leading());

    expect(result.current.flow.stepIndex).toBe(0);
    expect(mockExitModal).not.toHaveBeenCalled();
  });

  it("starts from an empty link again on tryAnotherLink()", async () => {
    const { result } = renderFlow();
    await checkLink(result, LINK);
    await waitFor(() => expect(result.current.flow.stepIndex).toBe(1));

    act(() => result.current.flow.tryAnotherLink());

    expect(result.current.flow.stepIndex).toBe(0);
    expect(result.current.flow.state).toMatchObject({ link: "" });
  });

  it("previews the sermon looked up for a valid link", async () => {
    const { result } = renderFlow();

    await checkLink(result, LINK);

    const { state } = result.current.flow;
    expect(state.step).toBe("preview");
    expect(state).toHaveProperty("checked.sermon", lookUpMockSermon(LINK));
  });

  it("keeps the checked link drawn after leading() from the preview, and drops it on tryAnotherLink()", async () => {
    const { result } = renderFlow();
    await checkLink(result, LINK);
    await waitFor(() => expect(result.current.flow.shownChecked).not.toBeNull());
    const shown = result.current.flow.shownChecked;

    act(() => result.current.flow.leading());
    expect(result.current.flow.shownChecked).toBe(shown);

    act(() => result.current.flow.tryAnotherLink());
    expect(result.current.flow.shownChecked).toBeNull();
  });

  it("archives the plan it made, once its build failed, on tryAnotherLink()", async () => {
    const { result } = renderFlow();
    const before = result.current.planIds;
    await checkLink(result, LINK);
    await waitFor(() => expect(result.current.flow.stepIndex).toBe(1));
    await act(async () => {
      await Promise.resolve(result.current.flow.next());
    });
    const created = result.current.planIds.find((id) => !before.includes(id)) ?? "";
    expect(created).not.toBe("");
    // A plan being built can't be archived; a failed build leaves it a draft.
    act(() => result.current.failBuild({ code: "noCaptions", message: "No captions." }));

    act(() => result.current.flow.tryAnotherLink());

    expect(result.current.statusOf(created)).toBe("archived");
  });
});

describe("useNewPlanFlow haptics", () => {
  async function toPreview() {
    const view = renderFlow();
    await checkLink(view.result, LINK);
    await waitFor(() => expect(view.result.current.flow.stepIndex).toBe(1));
    jest.mocked(haptics.tapFeedback).mockClear();
    return view;
  }

  it("taps as Continue accepts a valid link", async () => {
    const { result } = renderFlow();

    await checkLink(result, LINK);

    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
    expect(haptics.errorFeedback).not.toHaveBeenCalled();
  });

  it("gives an error haptic, and no tap, for a link that isn't one", async () => {
    const { result } = renderFlow();

    await checkLink(result, "last sunday");

    expect(haptics.errorFeedback).toHaveBeenCalledTimes(1);
    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });

  it("taps as Create my plan makes the plan", async () => {
    const { result } = await toPreview();

    await act(async () => {
      await Promise.resolve(result.current.flow.next());
    });

    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
  });

  it("selects once when another day count is picked", async () => {
    const { result } = await toPreview();

    act(() => result.current.flow.pickDays(4));

    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);
  });

  it("is silent when the day count already picked is picked again", async () => {
    const { result } = await toPreview();

    act(() => result.current.flow.pickDays(6));

    expect(haptics.selectionFeedback).not.toHaveBeenCalled();
  });

  it("selects once when the Quick Check toggle changes", async () => {
    const { result } = await toPreview();

    act(() => result.current.flow.setQuickCheck(false));

    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);
  });

  it("is silent when the Quick Check toggle is set to what it already is", async () => {
    const { result } = await toPreview();

    act(() => result.current.flow.setQuickCheck(true));

    expect(haptics.selectionFeedback).not.toHaveBeenCalled();
  });

  it("is silent on the paste step, where the day count and toggle aren't shown", () => {
    const { result } = renderFlow();

    act(() => result.current.flow.pickDays(4));
    act(() => result.current.flow.setQuickCheck(false));

    expect(haptics.selectionFeedback).not.toHaveBeenCalled();
  });
});
