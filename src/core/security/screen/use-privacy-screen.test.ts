import { renderHook } from "@testing-library/react-native";
import {
  disableAppSwitcherProtectionAsync,
  enableAppSwitcherProtectionAsync,
  usePreventScreenCapture,
} from "expo-screen-capture";

import { usePrivacyScreen } from "./use-privacy-screen";

jest.mock("expo-screen-capture", () => ({
  usePreventScreenCapture: jest.fn(),
  enableAppSwitcherProtectionAsync: jest.fn(),
  disableAppSwitcherProtectionAsync: jest.fn(),
}));

const enable = jest.mocked(enableAppSwitcherProtectionAsync);
const disable = jest.mocked(disableAppSwitcherProtectionAsync);

beforeEach(() => {
  enable.mockResolvedValue(undefined);
  disable.mockResolvedValue(undefined);
});

describe("usePrivacyScreen", () => {
  it("blocks screenshots while mounted", () => {
    renderHook(() => {
      usePrivacyScreen();
    });

    expect(usePreventScreenCapture).toHaveBeenCalled();
  });

  it("passes a key through, so two screens do not cancel each other", () => {
    renderHook(() => {
      usePrivacyScreen("settings");
    });

    expect(usePreventScreenCapture).toHaveBeenCalledWith("settings");
  });

  /**
   * The leak that is easier to exploit than a screenshot: iOS writes the
   * app-switcher snapshot to disk when the app backgrounds, and it stays there
   * until the app is next foregrounded.
   */
  it("blurs the app-switcher snapshot", () => {
    renderHook(() => {
      usePrivacyScreen();
    });

    expect(enable).toHaveBeenCalled();
  });

  it("removes the blur on unmount, so the app switcher stays usable elsewhere", () => {
    const { unmount } = renderHook(() => {
      usePrivacyScreen();
    });

    expect(disable).not.toHaveBeenCalled();
    unmount();
    expect(disable).toHaveBeenCalled();
  });

  /**
   * Hardening must not become the outage. A screen that refuses to render
   * because a blur could not be applied is a worse outcome than a screen without
   * the blur — and the user has no way to fix either.
   */
  it("still renders when the native call fails", () => {
    enable.mockRejectedValue(new Error("not available"));

    expect(() =>
      renderHook(() => {
        usePrivacyScreen();
      }),
    ).not.toThrow();
  });

  it("survives a failure to remove the blur", () => {
    disable.mockRejectedValue(new Error("not available"));

    const { unmount } = renderHook(() => {
      usePrivacyScreen();
    });

    expect(() => {
      unmount();
    }).not.toThrow();
  });
});
