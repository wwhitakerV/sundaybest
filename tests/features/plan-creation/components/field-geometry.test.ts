import { FIELD_ICON_CENTRE } from "@/features/plan-creation/components/field-geometry";

describe("FIELD_ICON_CENTRE", () => {
  it("is where a field's leading icon is centred: 1pt edge, 20pt inset, half a 22pt icon", () => {
    expect(FIELD_ICON_CENTRE).toBe(32);
  });
});
