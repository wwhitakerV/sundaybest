import * as Haptics from "expo-haptics";

import {
  errorFeedback,
  selectionFeedback,
  successFeedback,
  tapFeedback,
  warningFeedback,
} from "@/core/haptics/haptics";

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(),
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(Haptics.selectionAsync).mockResolvedValue(undefined);
  jest.mocked(Haptics.impactAsync).mockResolvedValue(undefined);
  jest.mocked(Haptics.notificationAsync).mockResolvedValue(undefined);
});

describe("haptics vocabulary", () => {
  it("selectionFeedback makes a selection haptic", () => {
    selectionFeedback();

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  it("tapFeedback makes a light impact", () => {
    tapFeedback();

    expect(Haptics.impactAsync).toHaveBeenCalledWith("light");
  });

  it("successFeedback makes a success notification", () => {
    successFeedback();

    expect(Haptics.notificationAsync).toHaveBeenCalledWith("success");
  });

  it("warningFeedback makes a warning notification", () => {
    warningFeedback();

    expect(Haptics.notificationAsync).toHaveBeenCalledWith("warning");
  });

  it("errorFeedback makes an error notification", () => {
    errorFeedback();

    expect(Haptics.notificationAsync).toHaveBeenCalledWith("error");
  });
});

/** Node's process events, typed narrowly: this test environment has no Node types. */
const node = globalThis as unknown as {
  process: {
    on: (event: "unhandledRejection", listener: () => void) => void;
    off: (event: "unhandledRejection", listener: () => void) => void;
  };
};

describe("a haptic that the device refuses", () => {
  type Case = [name: string, feedback: () => void, native: (...args: never[]) => Promise<void>];
  const cases: Case[] = [
    ["selectionFeedback", selectionFeedback, Haptics.selectionAsync],
    ["tapFeedback", tapFeedback, Haptics.impactAsync],
    ["successFeedback", successFeedback, Haptics.notificationAsync],
    ["warningFeedback", warningFeedback, Haptics.notificationAsync],
    ["errorFeedback", errorFeedback, Haptics.notificationAsync],
  ];

  it.each(cases)("%s swallows a rejected promise", async (_name, feedback, native) => {
    const unhandled = jest.fn();
    node.process.on("unhandledRejection", unhandled);
    jest.mocked(native).mockRejectedValue(new Error("no Taptic Engine"));

    expect(() => feedback()).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();

    node.process.off("unhandledRejection", unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });
});
