import { SETTINGS_ROWS } from "@/features/settings/logic/settings-rows";

describe("SETTINGS_ROWS", () => {
  it("lists the settings in display order", () => {
    expect(SETTINGS_ROWS.map((row) => row.label)).toEqual([
      "Daily reminder",
      "Bible translation",
      "Text size",
      "How plans are made",
      "Privacy policy",
      "Contact support",
    ]);
  });

  it("gives every row a unique testID", () => {
    const ids = SETTINGS_ROWS.map((row) => row.testID);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("leaves Contact support without a destination", () => {
    expect(SETTINGS_ROWS.find((row) => row.label === "Contact support")?.href).toBeUndefined();
  });
});
