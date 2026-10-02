import { READING_PAPERS, getReadingTheme } from "@/theme";
import { darkTheme, lightTheme } from "@/theme/tokens";

describe("READING_PAPERS", () => {
  it("lists the six papers in order, with their labels", () => {
    expect(READING_PAPERS.map(({ id, label }) => [id, label])).toEqual([
      ["white", "White"],
      ["ivory", "Ivory"],
      ["cream", "Cream"],
      ["sepia", "Sepia"],
      ["dusk", "Dusk"],
      ["night", "Night"],
    ]);
  });

  it("marks only dusk and night as dark", () => {
    expect(READING_PAPERS.filter(({ dark }) => dark).map(({ id }) => id)).toEqual([
      "dusk",
      "night",
    ]);
  });

  it("gives every paper a colour of its own", () => {
    const colours = READING_PAPERS.map(({ background }) => background);

    expect(new Set(colours).size).toBe(READING_PAPERS.length);
  });
});

describe("getReadingTheme", () => {
  it("is the light theme's own background on white", () => {
    expect(getReadingTheme("white").colors.background).toBe(lightTheme.colors.background);
  });

  it("is the dark theme's own text on night", () => {
    expect(getReadingTheme("night").colors.text).toBe(darkTheme.colors.text);
  });

  it.each(READING_PAPERS.filter(({ dark }) => !dark))(
    "puts the $id paper on the light theme",
    ({ id, background }) => {
      const theme = getReadingTheme(id);

      expect(theme.name).toBe("light");
      expect(theme.colors).toEqual({ ...lightTheme.colors, background });
    },
  );

  it.each(READING_PAPERS.filter(({ dark }) => dark))(
    "puts the $id paper on the dark theme",
    ({ id, background }) => {
      const theme = getReadingTheme(id);

      expect(theme.name).toBe("dark");
      expect(theme.colors).toEqual({ ...darkTheme.colors, background });
    },
  );
});
