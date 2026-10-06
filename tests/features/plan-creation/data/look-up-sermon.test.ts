import { aSermon } from "@tests/factories/api";
import { lookUpSermon } from "@/features/plan-creation/data/look-up-sermon";

describe("lookUpSermon", () => {
  it("keeps what New Plan's preview shows of the sermon the API looked up", () => {
    const sermon = aSermon({ church: "Cornerstone Church", durationSeconds: 2460 });

    expect(lookUpSermon(sermon)).toEqual({
      title: sermon.title,
      church: "Cornerstone Church",
      thumbnailUrl: null,
      thumbnailColors: [],
      durationSeconds: 2460,
      publishedOn: null,
      transcriptStatus: "available",
    });
  });
});
