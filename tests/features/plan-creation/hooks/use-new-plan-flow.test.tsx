import { http, HttpResponse } from "msw";
import * as Clipboard from "expo-clipboard";
import { useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { act, renderHook, waitFor } from "@tests/helpers/render";
import { API_URL, aGeneration, aSermon } from "@tests/factories/api";
import { server } from "@tests/mocks/server";
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
const LINK = aSermon().canonicalUrl;
let created: unknown[] = [];

/** Types a link and presses Continue, letting the sermon be looked up. */
async function checkLink(result: { current: ReturnType<typeof useNewPlanFlow> }, link: string) {
  act(() => result.current.changeLink(link));
  await act(async () => {
    await result.current.next();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  created = [];
  jest.mocked(useNavigation).mockReturnValue({ getParent: () => ({ goBack: mockExitModal }) });
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
  server.use(
    http.post(`${API_URL}/v1/sermons/resolve`, () => HttpResponse.json({ sermon: aSermon() })),
    http.get(`${API_URL}/v1/plan-generations/current`, () =>
      HttpResponse.json({ generations: [] }),
    ),
  );
});

describe("useNewPlanFlow", () => {
  it("opens on the paste step, with no link and no error", () => {
    const { result } = renderHook(useNewPlanFlow);

    expect(result.current.stepIndex).toBe(0);
    expect(result.current.state).toMatchObject({ step: "paste", link: "", linkError: null });
  });

  it("holds the link as it's typed", () => {
    const { result } = renderHook(useNewPlanFlow);

    act(() => result.current.changeLink(LINK));

    expect(result.current.state).toMatchObject({ link: LINK });
  });

  it("fills the link from the clipboard on paste()", async () => {
    jest.mocked(Clipboard.getStringAsync).mockResolvedValue(LINK);
    const { result } = renderHook(useNewPlanFlow);

    await act(() => result.current.paste());

    expect(result.current.state).toMatchObject({ link: LINK });
  });

  it("says so on an invalid link, and stays on the paste step", async () => {
    const { result } = renderHook(useNewPlanFlow);

    await checkLink(result, "not a link");

    expect(result.current.stepIndex).toBe(0);
    expect(result.current.state.step === "paste" && result.current.state.linkError).toBeTruthy();
  });

  it("previews the sermon the link is for", async () => {
    const { result } = renderHook(useNewPlanFlow);

    await checkLink(result, LINK);

    await waitFor(() => expect(result.current.stepIndex).toBe(1));
    expect(result.current.state).toHaveProperty("checked.sermonId", aSermon().id);
  });

  it("closes New Plan the moment the plan is asked for, without waiting for the server", async () => {
    server.use(
      http.post(`${API_URL}/v1/plans`, async ({ request }) => {
        created.push(await request.json());
        return new Promise<never>(() => undefined);
      }),
    );
    const { result } = renderHook(useNewPlanFlow);
    await checkLink(result, LINK);
    await waitFor(() => expect(result.current.stepIndex).toBe(1));

    act(() => void result.current.next());

    expect(mockExitModal).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(created).toEqual([{ sermonId: aSermon().id, lengthDays: 5, quickCheckEnabled: true }]),
    );
    expect(aGeneration().sermonId).toBe(aSermon().id);
  });

  it("leaves the flow on leading() from the paste step", () => {
    const { result } = renderHook(useNewPlanFlow);

    act(() => result.current.leading());

    expect(mockExitModal).toHaveBeenCalledTimes(1);
  });

  it("steps back to the paste step on leading() from the preview", async () => {
    const { result } = renderHook(useNewPlanFlow);
    await checkLink(result, LINK);
    await waitFor(() => expect(result.current.stepIndex).toBe(1));

    act(() => result.current.leading());

    expect(result.current.stepIndex).toBe(0);
    expect(mockExitModal).not.toHaveBeenCalled();
  });
});
