import { checkSermonLink, shortenLink } from "@/features/plan-creation/logic/sermon-link";

describe("checkSermonLink", () => {
  it("accepts a full link, trimmed", () => {
    expect(checkSermonLink("  https://youtube.com/watch?v=Qm81xRz4 ")).toEqual({
      valid: true,
      url: "https://youtube.com/watch?v=Qm81xRz4",
    });
  });

  it("adds https:// to a link pasted without it", () => {
    expect(checkSermonLink("youtu.be/Qm81xRz4")).toEqual({
      valid: true,
      url: "https://youtu.be/Qm81xRz4",
    });
  });

  it("asks for a link when there's nothing there", () => {
    expect(checkSermonLink("   ")).toEqual({
      valid: false,
      message: "Paste a link to a sermon video.",
    });
  });

  it("turns away text that isn't a link", () => {
    expect(checkSermonLink("last sunday's sermon").valid).toBe(false);
    expect(checkSermonLink("https://localhost/video").valid).toBe(false);
  });
});

describe("shortenLink", () => {
  it("keeps just the link's last part", () => {
    expect(shortenLink("https://youtube.com/watch?v=Qm81xRz4")).toBe("…/watch?v=Qm81xRz4");
  });

  it("ignores a trailing slash", () => {
    expect(shortenLink("https://vimeo.com/881240517/")).toBe("…/881240517");
  });
});
