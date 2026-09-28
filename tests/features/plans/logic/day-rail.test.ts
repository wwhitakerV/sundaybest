import {
  describeDayHeader,
  describeDaySteps,
  describeDayTile,
  describeQuickCheckStep,
  getJourneyLabel,
  getRailScrollOffset,
  getRailTabX,
  type StudyStepLook,
} from "@/features/plans/logic/day-rail";

describe("describeDayTile", () => {
  it("marks a finished day done", () => {
    const tile = describeDayTile({ dayNumber: 1, status: "completed", scheduledOn: null }, 2);

    expect(tile.mark).toBe("done");
    expect(tile.today).toBe(false);
    expect(tile.accessibilityLabel).toBe("Day 1, done");
  });

  it("marks the day the plan's on as today", () => {
    const tile = describeDayTile({ dayNumber: 2, status: "inProgress", scheduledOn: null }, 2);

    expect(tile.mark).toBeNull();
    expect(tile.today).toBe(true);
    expect(tile.accessibilityLabel).toBe("Day 2, today");
  });

  it("marks a day not open yet with a lock, and no more", () => {
    const tile = describeDayTile({ dayNumber: 3, status: "locked", scheduledOn: null }, 2);

    expect(tile.mark).toBe("locked");
    expect(tile.today).toBe(false);
    expect(tile.accessibilityLabel).toBe("Day 3, locked");
  });

  it("dates a day once the plan's schedule gives it one", () => {
    const tile = describeDayTile({ dayNumber: 3, status: "locked", scheduledOn: "2026-09-24" }, 2);

    expect(tile.date).toBe("Sep 24");
    expect(tile.accessibilityLabel).toBe("Day 3, locked, Sep 24");
  });

  it("leaves it undated until then", () => {
    expect(
      describeDayTile({ dayNumber: 1, status: "available", scheduledOn: null }, 1).date,
    ).toBeNull();
  });

  it("never calls a finished plan's last day today", () => {
    expect(describeDayTile({ dayNumber: 6, status: "completed", scheduledOn: null }, 6).today).toBe(
      false,
    );
  });
});

describe("getRailScrollOffset", () => {
  // 60pt tiles 8pt apart, inset 24pt either end, on a 393pt phone.
  const rail = { tileWidth: 60, gap: 8, inset: 24, viewportWidth: 393 };

  it("leaves the rail at its start for a day near it", () => {
    expect(getRailScrollOffset({ ...rail, index: 1, count: 7 })).toBe(0);
  });

  it("brings a day further along to the middle", () => {
    expect(getRailScrollOffset({ ...rail, index: 3, count: 7 })).toBeCloseTo(61.5);
  });

  it("never scrolls past the rail's end", () => {
    // 7 tiles: 24 + 7 × 60 + 6 × 8 + 24 = 516pt, 123pt wider than the phone.
    expect(getRailScrollOffset({ ...rail, index: 6, count: 7 })).toBe(123);
  });

  it("doesn't scroll a rail that fits", () => {
    expect(getRailScrollOffset({ ...rail, index: 3, count: 4 })).toBe(0);
  });
});

describe("getRailTabX", () => {
  it("sets the tab under the day picked: past the inset, a day's pitch along for each before it", () => {
    expect(getRailTabX({ index: 0, pitch: 64, inset: 24 })).toBe(24);
    expect(getRailTabX({ index: 3, pitch: 64, inset: 24 })).toBe(24 + 192);
  });
});

describe("getJourneyLabel", () => {
  it("names the days by how many there are", () => {
    expect(getJourneyLabel(6)).toBe("6-day journey");
    expect(getJourneyLabel(1)).toBe("1-day journey");
  });
});

describe("describeDaySteps", () => {
  const content = {
    readingTitle: "Grace is received",
    scriptureReference: "Ephesians 2:8",
    reflectionCount: 2,
  };
  const inProgress = { status: "inProgress" as const, completedSteps: ["read" as const] };

  it("lists a day's four steps in order, each with what it holds", () => {
    const steps = describeDaySteps(inProgress, content, { today: true });

    expect(steps.map(({ key, label, detail }) => [key, label, detail])).toEqual([
      ["read", "Read", "Grace is received"],
      ["scripture", "Scripture", "Ephesians 2:8"],
      ["reflect", "Reflect", "2 questions"],
      ["pray", "Pray", "Guided prayer"],
    ]);
  });

  it("marks those done, the next to do on the day the plan's on, and the rest to come", () => {
    const steps = describeDaySteps(inProgress, content, { today: true });

    expect(steps.map(({ status }) => status)).toEqual(["done", "current", "upcoming", "upcoming"]);
  });

  it("marks no step next on any other day", () => {
    const steps = describeDaySteps({ status: "available", completedSteps: [] }, content, {
      today: false,
    });

    expect(steps.map(({ status }) => status)).toEqual([
      "upcoming",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
  });

  it("locks every step of a locked day", () => {
    const steps = describeDaySteps({ status: "locked", completedSteps: [] }, content, {
      today: false,
    });

    expect(steps.every(({ status }) => status === "locked")).toBe(true);
  });

  it("opens every step of an open day — done, next, or to come", () => {
    const steps = describeDaySteps(inProgress, content, { today: true });

    expect(steps.every(({ opens }) => opens)).toBe(true);
  });

  it("opens no step of a locked day", () => {
    const steps = describeDaySteps({ status: "locked", completedSteps: [] }, content, {
      today: false,
    });

    expect(steps.some(({ opens }) => opens)).toBe(false);
  });

  it("tells VoiceOver each step's name, where it stands, and what it holds", () => {
    const [read, scripture] = describeDaySteps(inProgress, content, { today: true });

    expect(read?.accessibilityLabel).toBe("Read, done, Grace is received");
    expect(scripture?.accessibilityLabel).toBe("Scripture, next, Ephesians 2:8");
  });

  it("counts a single question as one, and leaves out what a day hasn't got", () => {
    const [, scripture, reflect] = describeDaySteps(
      inProgress,
      { ...content, scriptureReference: null, reflectionCount: 1 },
      { today: true },
    );

    expect(scripture?.detail).toBeNull();
    expect(reflect?.detail).toBe("1 question");
  });
});

describe("describeQuickCheckStep", () => {
  const quiz = {
    status: "notStarted" as const,
    questionCount: 3,
    answeredCount: 0,
    correctCount: 0,
  };

  it("has none for a day without a Quick Check", () => {
    expect(describeQuickCheckStep({ status: "completed" }, null)).toBeNull();
  });

  it("waits for the day's steps before it opens", () => {
    const step = describeQuickCheckStep({ status: "inProgress" }, quiz);

    expect(step).toMatchObject({
      key: "quickCheck",
      status: "waiting",
      detail: "After Pray",
      opens: false,
    });
  });

  it("is next, once the day's done, with how many questions it asks", () => {
    expect(describeQuickCheckStep({ status: "completed" }, quiz)).toMatchObject({
      status: "current",
      detail: "3 questions",
      opens: true,
    });
  });

  it("is next, half-way, with how many are answered", () => {
    expect(
      describeQuickCheckStep(
        { status: "completed" },
        { ...quiz, status: "inProgress", answeredCount: 1 },
      ),
    ).toMatchObject({ status: "current", detail: "1 of 3 answered" });
  });

  it("is done once taken, with how many were right", () => {
    expect(
      describeQuickCheckStep(
        { status: "completed" },
        { ...quiz, status: "completed", answeredCount: 3, correctCount: 2 },
      ),
    ).toMatchObject({ status: "done", detail: "2 of 3 correct", opens: true });
  });

  it("is locked on a locked day", () => {
    expect(describeQuickCheckStep({ status: "locked" }, quiz)).toMatchObject({
      status: "locked",
      detail: "3 questions",
      opens: false,
    });
  });

  it("tells VoiceOver where it stands", () => {
    expect(describeQuickCheckStep({ status: "inProgress" }, quiz)?.accessibilityLabel).toBe(
      "Quick Check, not open yet, After Pray",
    );
  });
});

describe("describeDayHeader", () => {
  const steps = (...statuses: StudyStepLook["status"][]) => statuses.map((status) => ({ status }));
  const underWay = steps("done", "done", "current", "upcoming");

  it("says how long the day takes, and how far through its four steps it is", () => {
    expect(
      describeDayHeader(
        { status: "inProgress", completedAt: null },
        { minutes: 5, steps: underWay },
      ),
    ).toEqual({ locked: false, meta: "5 min · 2 of 4 done" });
  });

  it("gives just its length before a step's done", () => {
    expect(
      describeDayHeader(
        { status: "available", completedAt: null },
        { minutes: 5, steps: steps("current", "upcoming", "upcoming", "upcoming") },
      ),
    ).toEqual({ locked: false, meta: "5 min" });
  });

  it("settles a finished day: when it finished", () => {
    expect(
      describeDayHeader(
        { status: "completed", completedAt: "2026-09-22T07:10:00.000Z" },
        { minutes: 5, steps: steps("done", "done", "done", "done") },
      ),
    ).toEqual({ locked: false, meta: "5 min · Finished Sep 22" });
  });

  it("says a finished day's finished, even without a date", () => {
    expect(
      describeDayHeader(
        { status: "completed", completedAt: null },
        { minutes: 5, steps: steps("done", "done", "done", "done") },
      ).meta,
    ).toBe("5 min · Finished");
  });

  it("gives a locked day just its length, and marks it locked", () => {
    expect(
      describeDayHeader(
        { status: "locked", completedAt: null },
        { minutes: 5, steps: steps("locked", "locked", "locked", "locked") },
      ),
    ).toEqual({ locked: true, meta: "5 min" });
  });
});
