import { layOutStatusBar } from "@/features/status-bar/logic/status-bar-layout";

describe("layOutStatusBar", () => {
  it("centres the time and battery in the ears beside a Dynamic Island", () => {
    const layout = layOutStatusBar(393, 59);

    expect(layout.height).toBe(59);
    expect(layout.centerY).toBe(29.5);
    // The island is about 126pt wide: each ear is (393 - 126) / 2 across.
    expect(layout.timeX).toBeCloseTo(66.75);
    expect(layout.batteryX).toBeCloseTo(393 - 66.75);
  });

  it("centres them in the ears beside a notch", () => {
    const layout = layOutStatusBar(390, 47);

    expect(layout.height).toBe(47);
    expect(layout.centerY).toBe(23.5);
    expect(layout.timeX).toBeCloseTo((390 - 162) / 4);
    expect(layout.batteryX).toBeCloseTo(390 - (390 - 162) / 4);
  });

  it("keeps to the width it's given, Display Zoom's included", () => {
    expect(layOutStatusBar(375, 59).timeX).toBeCloseTo((375 - 126) / 4);
  });

  it("gives a home-button iPhone its 20pt bar, the time and battery near its edges", () => {
    const layout = layOutStatusBar(375, 20);

    expect(layout).toMatchObject({ height: 20, centerY: 10, edged: true });
  });

  it("keeps the 20pt bar when the hidden system bar leaves no inset at all", () => {
    expect(layOutStatusBar(375, 0)).toMatchObject({ height: 20, centerY: 10, edged: true });
  });
});
