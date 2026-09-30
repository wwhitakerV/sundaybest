import { getAppVersion } from "@/core/config/app-version";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.0.0" } },
}));

describe("getAppVersion", () => {
  it("gives the app's version, as its config sets it", () => {
    expect(getAppVersion()).toBe("1.0.0");
  });
});
