import { getMoreMenuItems } from "@/features/plans/logic/more-menu";

describe("getMoreMenuItems", () => {
  it("ends with Reset plan", () => {
    expect(getMoreMenuItems(false).at(-1)).toEqual({ key: "reset", label: "Reset plan" });
  });

  it("still offers saving, the reminder, and how plans are made first", () => {
    expect(getMoreMenuItems(true).map(({ key }) => key)).toEqual([
      "save",
      "reminder",
      "howMade",
      "reset",
    ]);
  });
});
