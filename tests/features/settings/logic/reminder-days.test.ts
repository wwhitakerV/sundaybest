import { toggleReminderDay, WEEK } from "@/features/settings/logic/reminder-days";

describe("toggleReminderDay", () => {
  it("takes a picked day out", () => {
    expect(toggleReminderDay(["mon", "wed", "fri"], "wed")).toEqual(["mon", "fri"]);
  });

  it("puts a day back in its place in the week", () => {
    expect(toggleReminderDay(["mon", "fri"], "sun")).toEqual(["sun", "mon", "fri"]);
  });

  it("keeps the last day, so a reminder always has one — the same days, unchanged", () => {
    const days = ["mon"] as const;

    expect(toggleReminderDay(days, "mon")).toBe(days);
  });

  it("knows the week, Sunday first", () => {
    expect(WEEK).toEqual(["sun", "mon", "tue", "wed", "thu", "fri", "sat"]);
  });
});
