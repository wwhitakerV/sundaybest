import { parsePrivacyTopicParams } from "@/features/settings/logic/privacy-routes";

describe("parsePrivacyTopicParams", () => {
  it.each(["keep", "device", "use", "controls", "policy"])("reads the %s page", (topic) => {
    expect(parsePrivacyTopicParams({ topic })).toBe(topic);
  });

  it("reads nothing for a page there isn't", () => {
    expect(parsePrivacyTopicParams({ topic: "sermons" })).toBeNull();
  });

  it("reads nothing from params that aren't a page", () => {
    expect(parsePrivacyTopicParams({})).toBeNull();
    expect(parsePrivacyTopicParams({ topic: ["keep"] })).toBeNull();
    expect(parsePrivacyTopicParams(null)).toBeNull();
  });
});
