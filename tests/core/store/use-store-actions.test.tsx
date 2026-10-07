import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react-native";

import {
  AppStoreProvider,
  INITIAL_STATE,
  useAppSelector,
  useStoreActions,
  type AppState,
} from "@/core/store";
import * as reducerModule from "@/core/store/reducer";
import { readyToComplete } from "@tests/factories/store-days";

const DAY = "plan-today-i-choose-to-be-a-blessing-day-2";

/** A record from one of the store's tables, by ID. */
function byId<T>(table: Readonly<Record<string, T>>, id: string): T | undefined {
  return new Map(Object.entries(table)).get(id);
}

/** The store's actions and state, read through the hooks a screen uses. */
function mount(initialState: AppState = INITIAL_STATE) {
  return renderHook(
    () => ({ actions: useStoreActions(), state: useAppSelector((state) => state) }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AppStoreProvider initialState={initialState}>{children}</AppStoreProvider>
      ),
    },
  );
}

/** The day ready to finish: its steps and Quick Check done, as finishing asks. */
const READY_TO_FINISH = readyToComplete(
  INITIAL_STATE,
  "plan-today-i-choose-to-be-a-blessing",
  2,
  "2026-09-23",
  "2026-09-23T07:00:00.000Z",
);

describe("composite store actions dispatch exactly one action", () => {
  let reducerSpy: jest.SpyInstance;

  beforeEach(() => {
    reducerSpy = jest.spyOn(reducerModule, "appReducer");
  });
  afterEach(() => {
    reducerSpy.mockRestore();
  });

  /** The distinct action objects dispatched — React may call the reducer twice with one. */
  const actionsDispatched = (): { type: string }[] => [
    ...new Set(reducerSpy.mock.calls.map(([, action]: [unknown, { type: string }]) => action)),
  ];
  const expectOneAction = (type: string) => {
    const dispatched = actionsDispatched();
    expect(dispatched).toHaveLength(1);
    expect(dispatched.at(0)?.type).toBe(type);
  };

  it("finishPlanDay dispatches planDay/finish once, and the day is completed", () => {
    const { result } = mount(READY_TO_FINISH);
    reducerSpy.mockClear();
    act(() => result.current.actions.finishPlanDay(DAY, `${DAY}-prayer`));

    expectOneAction("planDay/finish");
    expect(byId(result.current.state.planDays, DAY)?.status).toBe("completed");
    expect(byId(result.current.state.prayers, `${DAY}-prayer`)?.prayedAt).not.toBeNull();
  });

  it("finishPlanDay accepts a null prayer", () => {
    const { result } = mount(READY_TO_FINISH);
    act(() => result.current.actions.finishPlanDay(DAY, null));

    expect(byId(result.current.state.planDays, DAY)?.status).toBe("completed");
  });

  it("commitReflections dispatches reflection/commit once", () => {
    const { result } = mount();
    reducerSpy.mockClear();
    const reflectionId = `${DAY}-reflection-2`;
    act(() =>
      result.current.actions.commitReflections([
        { kind: "save", reflectionId, answer: "A friend." },
      ]),
    );

    expectOneAction("reflection/commit");
    expect(byId(result.current.state.reflections, reflectionId)?.answer).toBe("A friend.");
  });

  it("createAndBuildPlan dispatches plan/createAndBuild once and returns the new plan id", () => {
    const { result } = mount();
    reducerSpy.mockClear();
    let planId = "";
    act(() => {
      planId = result.current.actions.createAndBuildPlan({
        sourceUrl: "https://youtu.be/abc123",
        title: "A new sermon",
        lengthDays: 4,
        quickCheckEnabled: true,
      });
    });

    expectOneAction("plan/createAndBuild");
    expect(planId).not.toBe("");
    expect(byId(result.current.state.plans, planId)?.status).toBe("generating");
    expect(result.current.state.generation?.planId).toBe(planId);
  });

  it("turnOnReminderAt dispatches settings/reminderOn once", () => {
    const { result } = mount();
    reducerSpy.mockClear();
    act(() => result.current.actions.turnOnReminderAt("reminder-quick-check", "20:15"));

    expectOneAction("settings/reminderOn");
    expect(byId(result.current.state.reminders, "reminder-quick-check")).toMatchObject({
      enabled: true,
      time: "20:15",
    });
  });
});

describe("reading settings actions", () => {
  let reducerSpy: jest.SpyInstance;

  beforeEach(() => {
    reducerSpy = jest.spyOn(reducerModule, "appReducer");
  });
  afterEach(() => {
    reducerSpy.mockRestore();
  });

  const actionsDispatched = (): { type: string }[] => [
    ...new Set(reducerSpy.mock.calls.map(([, action]: [unknown, { type: string }]) => action)),
  ];

  it("setReadingTextOffset dispatches settings/readingTextOffset once, and the offset changes", () => {
    const { result } = mount();
    reducerSpy.mockClear();
    act(() => result.current.actions.setReadingTextOffset(4));

    expect(actionsDispatched().map((action) => action.type)).toEqual([
      "settings/readingTextOffset",
    ]);
    expect(result.current.state.settings.readingTextOffset).toBe(4);
  });

  it("setReadingPaper dispatches settings/readingPaper once, and the paper changes", () => {
    const { result } = mount();
    reducerSpy.mockClear();
    act(() => result.current.actions.setReadingPaper("night"));

    expect(actionsDispatched().map((action) => action.type)).toEqual(["settings/readingPaper"]);
    expect(result.current.state.settings.readingPaper).toBe("night");
  });
});
