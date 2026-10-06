import { apiQueryKeys, isStudyDayQueryKey } from "@/core/api/query-keys";

describe("isStudyDayQueryKey", () => {
  it("matches a study day's key", () => {
    expect(isStudyDayQueryKey(apiQueryKeys.studyDay("plan-1", 2))).toBe(true);
  });

  it("does not match the plan the day belongs to", () => {
    expect(isStudyDayQueryKey(apiQueryKeys.plan("plan-1"))).toBe(false);
  });

  it("does not match the plans list", () => {
    expect(isStudyDayQueryKey(apiQueryKeys.plans)).toBe(false);
  });
});
