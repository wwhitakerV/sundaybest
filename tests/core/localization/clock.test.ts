import * as Localization from "expo-localization";

import { usesTwentyFourHourClock } from "@/core/localization/clock";

/** The iPhone's calendar settings, with its clock as given. */
function clock(uses24hourClock: boolean | null) {
  jest
    .spyOn(Localization, "getCalendars")
    .mockReturnValue([{ calendar: null, timeZone: null, firstWeekday: null, uses24hourClock }]);
}

describe("usesTwentyFourHourClock", () => {
  it("is true on an iPhone set to 24-hour time", () => {
    clock(true);

    expect(usesTwentyFourHourClock()).toBe(true);
  });

  it("is false on an iPhone set to 12-hour time", () => {
    clock(false);

    expect(usesTwentyFourHourClock()).toBe(false);
  });

  it("is false when the iPhone doesn't say, keeping the 12-hour clock", () => {
    clock(null);

    expect(usesTwentyFourHourClock()).toBe(false);
  });
});
