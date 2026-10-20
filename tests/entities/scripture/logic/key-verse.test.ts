import { pickKeyVerse } from "@/entities/scripture";

describe("pickKeyVerse", () => {
  it("takes the first verse that reads whole in four lines", () => {
    const verses = [
      { number: 1, text: "A".repeat(120) },
      { number: 2, text: "  Rejoice always.  " },
      { number: 3, text: "Pray without ceasing." },
    ];

    expect(pickKeyVerse(verses)).toBe("Rejoice always.");
  });

  it("takes the shortest when none is that short, never cut", () => {
    const long = "B".repeat(100);
    const longer = "C".repeat(140);

    expect(
      pickKeyVerse([
        { number: 1, text: longer },
        { number: 2, text: long },
      ]),
    ).toBe(long);
  });

  it("is nothing for a passage with no verses", () => {
    expect(pickKeyVerse([])).toBeNull();
  });
});
