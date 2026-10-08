import {
  parsePrivacyTopicParams,
  privacyTopicHref,
} from "@/features/settings/logic/privacy-routes";

describe("privacyTopicHref", () => {
  it("leads to a privacy page", () => {
    expect(privacyTopicHref("keep")).toEqual({
      pathname: "/(tabs)/settings/privacy/[topic]",
      params: { topic: "keep" },
    });
  });
});

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
