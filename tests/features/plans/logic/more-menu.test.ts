import { getMoreMenuItems } from "@/features/plans/logic/more-menu";

describe("getMoreMenuItems", () => {
  it("ends with Reset plan", () => {
    expect(getMoreMenuItems().at(-1)).toEqual({ key: "reset", label: "Reset plan" });
  });

  it("offers the reminder and how plans are made first", () => {
    expect(getMoreMenuItems().map(({ key }) => key)).toEqual(["reminder", "howMade", "reset"]);
  });
});
