import { lightTheme } from "@/theme/tokens";

const { typography } = lightTheme;

describe("typography tokens added for the typography family", () => {
  it.each([
    [
      "editorialQuestion",
      { fontFamily: "LibreBaskerville-Medium", fontSize: 24, fontWeight: "500", lineHeight: 30 },
    ],
    ["masthead", { fontFamily: "LibreBaskerville-Medium", fontSize: 16, fontWeight: "400" }],
    ["listItemLarge", { fontSize: 20, fontWeight: "500" }],
    [
      "metaLabelTracked",
      { fontFamily: "IBMPlexMono-Medium", fontSize: 13, fontWeight: "500", letterSpacing: 1 },
    ],
    ["headlineRegular", { fontSize: 24, fontWeight: "400" }],
    ["bodyLoose", { fontSize: 17, fontWeight: "400", lineHeight: 26 }],
    ["statusTime", { fontSize: 17, fontWeight: "600" }],
    ["fallbackTitle", { fontSize: 20, fontWeight: "600" }],
    ["fallbackBody", { fontSize: 15, fontWeight: "400" }],
    ["fallbackAction", { fontSize: 15, fontWeight: "600" }],
  ] as const)("defines %s with its exact value", (token, expected) => {
    expect(new Map(Object.entries(typography)).get(token)).toEqual(expected);
  });
});
