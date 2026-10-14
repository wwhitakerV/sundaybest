import {
  beatAt,
  beatList,
  recordFrame,
  SLOW_FRAME_MS,
  summarizeFrames,
} from "@/features/launch-intro/logic/frame-stats";

const BEATS = [
  { key: "pour", start: 0, end: 1650 },
  { key: "write", start: 1650, end: 6150 },
  { key: "pause", start: 6150, end: 6150 },
  { key: "fall", start: 6150, end: 6873 },
];

describe("beatAt", () => {
  it("names the beat a moment falls in", () => {
    expect(beatAt(BEATS, 100)).toBe("pour");
    expect(beatAt(BEATS, 6150)).toBe("fall");
  });

  it("names the blank beat before the intro, and anything after its beats", () => {
    expect(beatAt(BEATS, -50)).toBe("lead-in");
    expect(beatAt(BEATS, 7000)).toBe("after");
  });
});

describe("recordFrame", () => {
  it("adds a frame to its beat: how many, how long in all, the worst, and how many ran slow", () => {
    let stats = recordFrame({}, "write", 16);
    stats = recordFrame(stats, "write", 40);

    expect(stats.write).toEqual({ frames: 2, total: 56, worst: 40, slow: 1 });
  });

  it("never changes the tally it was given", () => {
    const before = recordFrame({}, "pour", 16);
    recordFrame(before, "pour", 50);

    expect(before.pour).toEqual({ frames: 1, total: 16, worst: 16, slow: 0 });
  });

  it("counts a frame as slow only past a 60Hz frame's time", () => {
    expect(recordFrame({}, "fall", SLOW_FRAME_MS).fall?.slow).toBe(0);
    expect(recordFrame({}, "fall", SLOW_FRAME_MS + 1).fall?.slow).toBe(1);
  });
});

describe("summarizeFrames", () => {
  it("gives each beat's average and worst frame time, and its slow frames", () => {
    const stats = recordFrame(recordFrame({}, "write", 10), "write", 30);

    expect(summarizeFrames(stats)).toEqual(["write: avg 20.0ms, worst 30.0ms, 1/2 slow"]);
  });
});

describe("beatList", () => {
  it("lists an intro's beats in order, by name", () => {
    expect(beatList({ pour: { start: 0, end: 10 }, write: { start: 10, end: 20 } })).toEqual([
      { key: "pour", start: 0, end: 10 },
      { key: "write", start: 10, end: 20 },
    ]);
  });
});
