import { sermonSummarySchema } from "@/core/api/contracts";
import { aSermon } from "@tests/factories/api";

describe("sermonSummarySchema", () => {
  it("keeps the series and part a sermon's title names", () => {
    const sermon = sermonSummarySchema.parse({ ...aSermon(), series: "Unshakable", part: "Part 2" });
    expect([sermon.series, sermon.part]).toEqual(["Unshakable", "Part 2"]);
  });

  it("reads a sermon saved before series were kept as from none", () => {
    const { series: _series, part: _part, ...saved } = aSermon();
    const sermon = sermonSummarySchema.parse(saved);
    expect([sermon.series, sermon.part]).toEqual([null, null]);
  });
});
