import { describeBattery } from "@/features/status-bar/logic/battery-look";

const power = (over: Partial<Parameters<typeof describeBattery>[0] & object> = {}) => ({
  level: 82,
  charging: false,
  full: false,
  lowPower: false,
  ...over,
});

describe("describeBattery", () => {
  it("shows nothing when the phone can't say how charged it is", () => {
    expect(describeBattery(null)).toBeNull();
  });

  it("shows its percentage in ink, upright — and no fill, which would cross the figures", () => {
    expect(describeBattery(power())).toEqual({
      level: 82,
      tone: "ink",
      italic: false,
      endCap: "dot",
      spoken: "Battery 82 percent",
    });
  });

  it("turns red at 20% or less", () => {
    expect(describeBattery(power({ level: 20 }))?.tone).toBe("low");
    expect(describeBattery(power({ level: 21 }))?.tone).toBe("ink");
  });

  it("sets its figures italic in Low Power Mode, still in ink", () => {
    expect(describeBattery(power({ lowPower: true }))).toMatchObject({
      tone: "ink",
      italic: true,
    });
  });

  it("stays red when low, even in Low Power Mode, its figures still italic", () => {
    expect(describeBattery(power({ level: 9, lowPower: true }))).toMatchObject({
      tone: "low",
      italic: true,
    });
  });

  it("ends in a bolt while it charges, and while it's full on the charger", () => {
    expect(describeBattery(power({ charging: true }))?.endCap).toBe("bolt");
    expect(describeBattery(power({ level: 100, full: true }))?.endCap).toBe("bolt");
  });

  it("says its state aloud", () => {
    expect(describeBattery(power({ charging: true, lowPower: true }))?.spoken).toBe(
      "Battery 82 percent, charging, Low Power Mode",
    );
    expect(describeBattery(power())?.spoken).toBe("Battery 82 percent");
  });
});
