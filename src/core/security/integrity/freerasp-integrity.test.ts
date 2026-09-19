import { renderHook } from "@testing-library/react-native";
import { useFreeRasp } from "freerasp-react-native";

import {
  PLACEHOLDER_APP_TEAM_ID,
  PLACEHOLDER_WATCHER_MAIL,
  buildActions,
  shouldMonitorIntegrity,
  useIntegrityMonitor,
} from "./freerasp-integrity";
import { createIntegrityState, INTEGRITY_SIGNALS } from "./policy";

jest.mock("freerasp-react-native", () => ({ useFreeRasp: jest.fn() }));

const mockUseFreeRasp = jest.mocked(useFreeRasp);

function deps(overrides: Partial<Parameters<typeof useIntegrityMonitor>[0]> = {}) {
  return {
    variant: "production" as const,
    bundleId: "com.walterwhitaker.sundaybest",
    integrity: createIntegrityState(),
    onSessionCompromised: jest.fn(),
    ...overrides,
  };
}

describe("shouldMonitorIntegrity", () => {
  /**
   * A simulator trips `simulator`, `debug`, and `devMode` by design, so running
   * this in development yields nothing but noise — and a session that clears
   * itself on every launch.
   */
  it("is off in development", () => {
    expect(shouldMonitorIntegrity("development")).toBe(false);
  });

  it.each(["preview", "production"] as const)("is on in %s", (variant) => {
    expect(shouldMonitorIntegrity(variant)).toBe(true);
  });
});

describe("useIntegrityMonitor", () => {
  it("reports production only for the production variant", () => {
    renderHook(() => {
      useIntegrityMonitor(deps({ variant: "preview" }));
    });

    expect(mockUseFreeRasp.mock.calls[0]?.[0]).toMatchObject({ isProd: false });
  });

  it("passes the bundle id and the placeholder account values", () => {
    renderHook(() => {
      useIntegrityMonitor(deps());
    });

    expect(mockUseFreeRasp.mock.calls[0]?.[0]).toMatchObject({
      isProd: true,
      watcherMail: PLACEHOLDER_WATCHER_MAIL,
      iosConfig: {
        appBundleId: "com.walterwhitaker.sundaybest",
        appTeamId: PLACEHOLDER_APP_TEAM_ID,
      },
    });
  });

  /**
   * Terminating the app on an unfamiliar device turns a security control into
   * the outage, and on a device the attacker owns it is patched out anyway. The
   * app degrades; the server is what actually refuses.
   */
  it("never lets the sdk kill the app", () => {
    renderHook(() => {
      useIntegrityMonitor(deps());
    });

    expect(mockUseFreeRasp.mock.calls[0]?.[0]).toMatchObject({ killOnBypass: false });
  });

  it("registers a handler for every signal the policy knows", () => {
    renderHook(() => {
      useIntegrityMonitor(deps());
    });

    const actions = mockUseFreeRasp.mock.calls[0]?.[1] ?? {};
    expect(Object.keys(actions).sort()).toEqual([...INTEGRITY_SIGNALS].sort());
  });
});

describe("buildActions", () => {
  it("records a signal against the shared state", () => {
    const integrity = createIntegrityState();
    const actions = buildActions({ integrity, onSessionCompromised: jest.fn() });

    actions.privilegedAccess?.();

    expect(integrity.snapshot()).toMatchObject({
      sensitiveAllowed: false,
      signals: ["privilegedAccess"],
    });
  });

  it("clears the session when the app itself is compromised", () => {
    const onSessionCompromised = jest.fn();
    const actions = buildActions({
      integrity: createIntegrityState(),
      onSessionCompromised,
    });

    actions.hooks?.();

    expect(onSessionCompromised).toHaveBeenCalledTimes(1);
  });

  it("does not clear the session for a report-only signal", () => {
    const onSessionCompromised = jest.fn();
    const actions = buildActions({
      integrity: createIntegrityState(),
      onSessionCompromised,
    });

    actions.systemVPN?.();

    expect(onSessionCompromised).not.toHaveBeenCalled();
  });

  it("reports the signal and the response it produced, for monitoring", () => {
    const onSignal = jest.fn();
    const actions = buildActions({
      integrity: createIntegrityState(),
      onSessionCompromised: jest.fn(),
      onSignal,
    });

    actions.simulator?.();

    expect(onSignal).toHaveBeenCalledWith("simulator", "disable-sensitive");
  });

  /**
   * These run inside callbacks the SDK invokes. A rejection escaping one is both
   * a crash and a blind spot — the app dies *and* the signal is lost, which is
   * the worst of both.
   */
  describe("never throws back into the sdk", () => {
    it("survives a handler whose side effect throws", () => {
      const actions = buildActions({
        integrity: createIntegrityState(),
        onSessionCompromised: (): void => {
          throw new Error("session clear failed");
        },
      });

      expect(() => void actions.hooks?.()).not.toThrow();
    });

    it("survives a monitoring callback that throws", () => {
      const actions = buildActions({
        integrity: createIntegrityState(),
        onSessionCompromised: jest.fn(),
        onSignal: (): void => {
          throw new Error("logger exploded");
        },
      });

      expect(() => void actions.passcode?.()).not.toThrow();
    });
  });
});
