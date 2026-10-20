import { renderHook } from "@testing-library/react-native";

import type * as Battery from "@/core/device/battery";
import { readPowerState } from "@/core/device/battery";

// expo-battery's BatteryState: UNKNOWN 0, UNPLUGGED 1, CHARGING 2, FULL 3.
const raw = (over: object = {}) => ({
  batteryLevel: 0.82,
  batteryState: 1,
  lowPowerMode: false,
  ...over,
});

describe("readPowerState", () => {
  it("reads the level as a whole percentage", () => {
    expect(readPowerState(raw({ batteryLevel: 0.759999 }))).toEqual({
      level: 76,
      charging: false,
      full: false,
      lowPower: false,
    });
  });

  it("knows charging, full on the charger, and Low Power Mode", () => {
    expect(readPowerState(raw({ batteryState: 2 }))?.charging).toBe(true);
    expect(readPowerState(raw({ batteryLevel: 1, batteryState: 3 }))).toMatchObject({
      level: 100,
      full: true,
    });
    expect(readPowerState(raw({ lowPowerMode: true }))?.lowPower).toBe(true);
  });

  it("is nothing when the phone can't say: a simulator's -1, or an unknown state", () => {
    expect(readPowerState(raw({ batteryLevel: -1 }))).toBeNull();
    expect(readPowerState(raw({ batteryState: 0 }))).toBeNull();
  });

  it("is nothing when what comes back isn't a reading", () => {
    expect(readPowerState({ batteryLevel: "82%" })).toBeNull();
    expect(readPowerState(undefined)).toBeNull();
  });
});

describe("usePowerState", () => {
  afterEach(() => jest.resetModules());

  it("reads the phone's battery through expo-battery", () => {
    jest.isolateModules(() => {
      jest.doMock("@/core/device/battery-module", () => ({
        loadBatteryModule: () => ({ usePowerState: () => raw({ batteryState: 2 }) }),
      }));
      const { usePowerState } = jest.requireActual<typeof Battery>("@/core/device/battery");

      const { result } = renderHook(() => usePowerState());

      expect(result.current).toEqual({ level: 82, charging: true, full: false, lowPower: false });
    });
  });

  it("is nothing on a build without the battery module, rather than failing", () => {
    jest.isolateModules(() => {
      jest.doMock("@/core/device/battery-module", () => ({ loadBatteryModule: () => null }));
      const { usePowerState } = jest.requireActual<typeof Battery>("@/core/device/battery");

      const { result } = renderHook(() => usePowerState());

      expect(result.current).toBeNull();
    });
  });
});
