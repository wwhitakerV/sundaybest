import { withoutUndefined } from "@/utils/object/withoutUndefined";

describe("withoutUndefined", () => {
  it("keeps every field that has a value", () => {
    expect(withoutUndefined({ theme: "dark", textSize: "large" })).toEqual({
      theme: "dark",
      textSize: "large",
    });
  });

  it("drops a field left undefined, so it can't blank the value it's spread over", () => {
    expect({
      ...{ theme: "light", textSize: "small" },
      ...withoutUndefined({ theme: undefined, textSize: "large" }),
    }).toEqual({
      theme: "light",
      textSize: "large",
    });
  });

  it("keeps falsy values that aren't undefined", () => {
    expect(withoutUndefined({ enabled: false, count: 0, name: "", note: null })).toEqual({
      enabled: false,
      count: 0,
      name: "",
      note: null,
    });
  });
});
