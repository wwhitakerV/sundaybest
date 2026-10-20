import { describeRemembered, describeUpNext } from "@/features/plans/logic/day-complete";

const TODAY = "2026-09-23";
const REMINDER_ON = { enabled: true, time: "06:30" };

describe("describeUpNext", () => {
  it("says it opens tomorrow, with the reminder's time beside it", () => {
    expect(describeUpNext("2026-09-24", TODAY, REMINDER_ON)).toBe(
      "Opens tomorrow · Reminder at 6:30 AM",
    );
  });

  it("names the weekday when it opens later", () => {
    expect(describeUpNext("2026-09-25", TODAY, null)).toBe("Opens Friday");
  });

  it("says it's open now when its day has come, or it has no date", () => {
    expect(describeUpNext(TODAY, TODAY, null)).toBe("Open now");
    expect(describeUpNext(null, TODAY, null)).toBe("Open now");
  });

  it("leaves the reminder out when it's off", () => {
    expect(describeUpNext("2026-09-24", TODAY, { enabled: false, time: "06:30" })).toBe(
      "Opens tomorrow",
    );
  });

  it("gives the reminder's time on the 24-hour clock when the phone uses it", () => {
    expect(describeUpNext("2026-09-24", TODAY, { enabled: true, time: "19:05" }, true)).toBe(
      "Opens tomorrow · Reminder at 19:05",
    );
  });
});

describe("describeRemembered", () => {
  it("says how many were remembered, of how many", () => {
    expect(describeRemembered(8, 10)).toBe("You remembered 8 of 10");
  });
});
