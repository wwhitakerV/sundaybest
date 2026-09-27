import {
  describeDayPanel,
  describeDaySteps,
  describeDayTile,
  describeQuickCheckStep,
  getJourneyLabel,
  getRailScrollOffset,
  getRailTabX,
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

    expect(step).toMatchObject({ key: "quickCheck", status: "waiting", detail: "After Pray" });
  });

  it("is next, once the day's done, with how many questions it asks", () => {
    expect(describeQuickCheckStep({ status: "completed" }, quiz)).toMatchObject({
      status: "current",
      detail: "3 questions",
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
    ).toMatchObject({ status: "done", detail: "2 of 3 correct" });
  });

  it("is locked on a locked day", () => {
    expect(describeQuickCheckStep({ status: "locked" }, quiz)).toMatchObject({
      status: "locked",
      detail: "3 questions",
    });
  });

  it("tells VoiceOver where it stands", () => {
    expect(describeQuickCheckStep({ status: "inProgress" }, quiz)?.accessibilityLabel).toBe(
      "Quick Check, not open yet, After Pray",
    );
  });
});

describe("describeDayPanel", () => {
  const counts = { minutes: 5, stepsDone: 2, stepsTotal: 5, totalDays: 6 };

  it("puts the day the plan's on first: today, how long, and how far through", () => {
    expect(
      describeDayPanel(
        { dayNumber: 2, status: "inProgress", completedAt: null },
        {
          ...counts,
          today: true,
        },
      ),
    ).toEqual({ state: "today", eyebrow: "Today · Day 2 of 6", meta: "5 min · 2 of 5 done" });
  });

  it("settles a finished day: completed, and when", () => {
    expect(
      describeDayPanel(
        { dayNumber: 1, status: "completed", completedAt: "2026-09-22T07:10:00.000Z" },
        { ...counts, today: false },
      ),
    ).toEqual({
      state: "done",
      eyebrow: "Completed · Day 1 of 6",
      meta: "5 min · Finished Sep 22",
    });
  });

  it("marks a locked day unavailable, with just its length", () => {
    expect(
      describeDayPanel(
        { dayNumber: 3, status: "locked", completedAt: null },
        {
          ...counts,
          today: false,
        },
      ),
    ).toEqual({ state: "locked", eyebrow: "Locked · Day 3 of 6", meta: "5 min" });
  });
});
