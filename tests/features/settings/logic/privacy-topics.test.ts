import { PRIVACY_TOPICS } from "@/features/settings/logic/privacy-topics";

const everyWord = (topic: (typeof PRIVACY_TOPICS)[number]) => JSON.stringify(topic).toLowerCase();

describe("PRIVACY_TOPICS", () => {
  it("covers the short version's four pages, then the complete policy", () => {
    expect(PRIVACY_TOPICS.map(({ id }) => id)).toEqual([
      "keep",
      "device",
      "use",
      "controls",
      "policy",
    ]);
  });

  it("numbers the four pages 01 to 04", () => {
    expect(PRIVACY_TOPICS.slice(0, 4).map(({ eyebrow }) => eyebrow)).toEqual([
      "Privacy / 01",
      "Privacy / 02",
      "Privacy / 03",
      "Privacy / 04",
    ]);
  });

  it("gives every page a statement, an opening line, and something to read under headings", () => {
    for (const topic of PRIVACY_TOPICS) {
      expect(topic.statement.length).toBeGreaterThan(0);
      expect(topic.intro.length).toBeGreaterThan(0);
      expect(topic.sections.length).toBeGreaterThan(0);
      for (const section of topic.sections) {
        expect((section.paragraphs?.length ?? 0) + (section.items?.length ?? 0)).toBeGreaterThan(0);
      }
    }
  });

  it("dates and numbers the complete policy, as a document is", () => {
    const policy = PRIVACY_TOPICS.find(({ id }) => id === "policy");

    expect(policy?.effective).toBe("Effective October 7, 2026 · Privacy version 1.0");
    expect(policy?.numbered).toBe(true);
  });

  it("only points to real settings", () => {
    const hrefs = PRIVACY_TOPICS.flatMap(({ sections }) =>
      sections.flatMap(({ actions }) => actions?.map(({ href }) => href) ?? []),
    );

    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect([
        "/(tabs)/settings/daily-reminder",
        "/(tabs)/settings/bible-translation",
        "/(tabs)/settings/text-size",
      ]).toContain(href);
    }
  });

  it("promises no deletion the app doesn't offer yet", () => {
    for (const topic of PRIVACY_TOPICS) {
      expect(everyWord(topic)).not.toMatch(/delet/);
    }
  });

  it("never says Scripture comes from partners", () => {
    for (const topic of PRIVACY_TOPICS) {
      expect(everyWord(topic)).not.toMatch(/partner/);
    }
  });
});
