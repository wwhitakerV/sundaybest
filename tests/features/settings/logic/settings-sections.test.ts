import {
  describeSettingsSections,
  formatShortVersion,
} from "@/features/settings/logic/settings-sections";

const PREFS = {
  reminderTime: "06:30",
  translation: "BSB",
  textSize: "default",
  twentyFourHour: false,
} as const;

describe("describeSettingsSections", () => {
  it("groups the settings as Your routine, About, and For churches, in order", () => {
    expect(describeSettingsSections(PREFS).map(({ title }) => title)).toEqual([
      "Your routine",
      "About",
      "For churches",
    ]);
  });

  it("says each routine setting's value beside it", () => {
    const [routine] = describeSettingsSections(PREFS);

    expect(routine?.rows.map(({ label, value }) => [label, value])).toEqual([
      ["Daily reminder", "6:30 AM"],
      ["Bible translation", "BSB"],
      ["Text size", "Default"],
    ]);
  });

  it("says Off for a reminder that isn't set", () => {
    const [routine] = describeSettingsSections({ ...PREFS, reminderTime: null });

    expect(routine?.rows.at(0)?.value).toBe("Off");
  });

  it("names a text size in words", () => {
    const [routine] = describeSettingsSections({ ...PREFS, textSize: "extraLarge" });

    expect(routine?.rows.at(2)?.value).toBe("Extra large");
  });
});

describe("formatShortVersion", () => {
  it("drops a trailing .0 patch: 1.0.0 → 1.0", () => {
    expect(formatShortVersion("1.0.0")).toBe("1.0");
    expect(formatShortVersion("1.2.3")).toBe("1.2.3");
  });

  it("writes the reminder's time on the iPhone's 24-hour clock when it uses one", () => {
    const [routine] = describeSettingsSections({
      ...PREFS,
      reminderTime: "12:40",
      twentyFourHour: true,
    });

    expect(routine?.rows[0]?.value).toBe("12:40");
  });
});
