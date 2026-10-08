import { http, HttpResponse } from "msw";
import { act, renderHook, waitFor } from "@tests/helpers/render";
import { useFocusEffect, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL, aUser } from "@tests/factories/api";
import { aPlan } from "@tests/factories/api-plans";
import { servePlans } from "@tests/mocks/plans-api";
import { server } from "@tests/mocks/server";
import { usePlansQuery } from "@/core/api/plan-queries";
import { tapFeedback } from "@/core/haptics/haptics";
import { planOverviewHref } from "@/entities/plan";
import { useWelcomeStart } from "@/features/welcome/hooks/use-welcome-start";

jest.mock("@/core/haptics/haptics", () => ({ tapFeedback: jest.fn() }));

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useFocusEffect: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();

/** A sample plan the reader can look at before making their own. */
const SAMPLE = aPlan({ seed: 9, status: "ready", isSample: true, title: "A sample plan" });

/** Long enough for a frame and the onboarding request to have come and gone. */
const SETTLE_MS = 300;
const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, SETTLE_MS)));

/**
 * Welcome's start, once the reader's plans have arrived — the server serving
 * these plans, and recording each time onboarding is completed.
 */
async function renderStart(plans: Parameters<typeof servePlans>[0] = [aPlan(), SAMPLE]) {
  servePlans(plans);
  let onboarded = 0;
  server.use(
    http.post(`${API_URL}/v1/me/onboarding/complete`, () => {
      onboarded += 1;
      return HttpResponse.json({ user: aUser({ onboardedAt: "2026-10-05T12:00:00.000Z" }) });
    }),
  );
  const view = renderHook(() => ({ start: useWelcomeStart(), plans: usePlansQuery() }));
  await waitFor(() => expect(view.result.current.plans.isSuccess).toBe(true));
  return { ...view, onboardings: () => onboarded };
}

/** Runs the cleanup Welcome registered for losing focus — as leaving the screen does. */
function leaveScreen() {
  const focusCallback = jest.mocked(useFocusEffect).mock.calls.at(-1)?.[0];
  let cleanup: unknown;
  act(() => {
    cleanup = focusCallback?.();
  });
  act(() => {
    if (typeof cleanup === "function") (cleanup as () => void)();
  });
}

// A start() begun in one test finishes on its own frame and request: let it,
// before the next test, so it never lands in that test's mocks.
afterEach(async () => {
  await settle();
});

beforeEach(() => {
  mockPush.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

describe("useWelcomeStart", () => {
  it("goes to Home, then New Plan, on start() with no plans", async () => {
    const { result } = await renderStart([SAMPLE]);

    act(() => result.current.start.start());

    await waitFor(() =>
      expect(mockPush.mock.calls).toEqual([["/(tabs)/home"], ["/(plan-creation)/paste-sermon"]]),
    );
  });

  it("goes to Home only on start() with plans", async () => {
    const { result } = await renderStart();

    act(() => result.current.start.start());

    await waitFor(() => expect(mockPush.mock.calls).toEqual([["/(tabs)/home"]]));
  });

  it("buzzes on start()", async () => {
    const { result } = await renderStart();

    act(() => result.current.start.start());

    expect(tapFeedback).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
  });

  it("saves the reader as onboarded before it goes anywhere", async () => {
    const { result, onboardings } = await renderStart();

    act(() => result.current.start.start());

    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    expect(onboardings()).toBe(1);
  });

  it("stays put, starting no more, when onboarding can't be saved", async () => {
    const { result } = await renderStart();
    server.use(
      http.post(`${API_URL}/v1/me/onboarding/complete`, () =>
        HttpResponse.json({ error: { code: "NOT_FOUND", message: "No" } }, { status: 404 }),
      ),
    );

    act(() => result.current.start.start());

    await waitFor(() => expect(result.current.start.starting).toBe(false));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("opens the sample plan's overview on seeSample()", async () => {
    const { result } = await renderStart();

    act(() => result.current.start.seeSample());

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(planOverviewHref(SAMPLE.id)));
  });
});

describe("useWelcomeStart's wait", () => {
  it("is not starting at first", async () => {
    const { result } = await renderStart();

    expect(result.current.start.starting).toBe(false);
  });

  it("is starting at once on start()", async () => {
    const { result } = await renderStart();

    act(() => result.current.start.start());

    expect(result.current.start.starting).toBe(true);
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
  });

  it("holds its routes back until a frame has passed and onboarding is saved", async () => {
    const { result } = await renderStart();

    act(() => result.current.start.start());
    expect(mockPush).not.toHaveBeenCalled();

    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
  });

  it("ignores a second start() while starting", async () => {
    const { result, onboardings } = await renderStart();

    act(() => result.current.start.start());
    act(() => result.current.start.start());
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    await settle();

    expect(tapFeedback).toHaveBeenCalledTimes(1);
    expect(onboardings()).toBe(1);
    expect(mockPush.mock.calls).toEqual([["/(tabs)/home"]]);
  });

  it("stops starting when the screen loses focus", async () => {
    const { result } = await renderStart();
    act(() => result.current.start.start());
    expect(result.current.start.starting).toBe(true);

    leaveScreen();

    expect(result.current.start.starting).toBe(false);
  });

  it("doesn't move on if the screen is left before the frame comes", async () => {
    const { result } = await renderStart();
    act(() => result.current.start.start());

    leaveScreen();
    await settle();

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("starts again once it's back on the screen after leaving it", async () => {
    const { result } = await renderStart();
    act(() => result.current.start.start());
    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
    leaveScreen();

    act(() => result.current.start.start());

    await waitFor(() => expect(mockPush.mock.calls).toEqual([["/(tabs)/home"], ["/(tabs)/home"]]));
  });
});
