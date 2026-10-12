import { isUnderSheet } from "@/ui/organisms/tab-bar/use-tab-bar-shown";

const over = (top: string) => ({ index: 1, routes: [{ name: "(tabs)" }, { name: top }] });

describe("isUnderSheet", () => {
  it("is true when what covers the tabs is one of the sheets the bar stays under", () => {
    expect(isUnderSheet(over("generation"), ["generation"])).toBe(true);
  });

  it("is false for anything else over the tabs — a full-screen page or modal", () => {
    expect(isUnderSheet(over("study"), ["generation"])).toBe(false);
  });

  it("is false with nothing to read", () => {
    expect(isUnderSheet(undefined, ["generation"])).toBe(false);
  });
});
