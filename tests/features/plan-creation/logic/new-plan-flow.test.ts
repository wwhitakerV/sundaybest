import type { SermonPreview } from "@/features/plan-creation/data/search-sermons";
import {
  getNewPlanStepIndex,
  initialNewPlanState,
  newPlanReducer,
  type CheckedLink,
  type NewPlanState,
} from "@/features/plan-creation/logic/new-plan-flow";

const sermon: SermonPreview = {
  title: "Walking in the Light",
  church: "Cornerstone Church",
  thumbnailUrl: null,
  thumbnailColors: ["#111111", "#222222"],
  durationSeconds: 2_460,
  publishedOn: null,
  transcriptStatus: "available",
};
const checked: CheckedLink = {
  sermonId: "sermon-abc",
  url: "https://youtube.com/watch?v=abc",
  sermon,
};
const choosing = { inputMode: "paste", searchQuery: "", searchSelection: null } as const;

const paste = (over: Partial<Extract<NewPlanState, { step: "paste" }>> = {}): NewPlanState =>
  Object.freeze({ ...initialNewPlanState({ days: 5, quickCheck: true }), ...over }) as NewPlanState;

const preview = (over: Partial<Extract<NewPlanState, { step: "preview" }>> = {}): NewPlanState =>
  Object.freeze({
    step: "preview",
    link: "https://youtube.com/watch?v=abc",
    checked,
    days: 5,
    quickCheck: true,
    ...choosing,
    ...over,
  });

describe("initialNewPlanState", () => {
  it("starts on the paste step with an empty link and no error", () => {
    expect(initialNewPlanState({ days: 3, quickCheck: false })).toEqual({
      step: "paste",
      link: "",
      linkError: null,
      days: 3,
      quickCheck: false,
      ...choosing,
    });
  });
});

describe("newPlanReducer", () => {
  describe("linkChanged", () => {
    it("sets the link and clears the error on paste", () => {
      const next = newPlanReducer(paste({ linkError: "Not a link" }), {
        type: "linkChanged",
        link: "abc",
      });
      expect(next).toMatchObject({ step: "paste", link: "abc", linkError: null });
    });

    it("is ignored on preview", () => {
      const state = preview();
      expect(newPlanReducer(state, { type: "linkChanged", link: "x" })).toBe(state);
    });
  });

  describe("linkRejected", () => {
    it("sets the error on paste", () => {
      const next = newPlanReducer(paste({ link: "abc" }), {
        type: "linkRejected",
        message: "Not a link",
      });
      expect(next).toMatchObject({ step: "paste", link: "abc", linkError: "Not a link" });
    });

    it("is ignored on preview", () => {
      const state = preview();
      expect(newPlanReducer(state, { type: "linkRejected", message: "x" })).toBe(state);
    });
  });

  describe("linkAccepted", () => {
    it("moves paste to preview, carrying link, days, and quickCheck", () => {
      const state = paste({ link: "abc", days: 4, quickCheck: false });
      expect(newPlanReducer(state, { type: "linkAccepted", checked })).toEqual({
        step: "preview",
        link: "abc",
        checked,
        days: 4,
        quickCheck: false,
        ...choosing,
      });
    });

    it("is ignored on preview", () => {
      const state = preview();
      expect(newPlanReducer(state, { type: "linkAccepted", checked })).toBe(state);
    });

    it("a repeat leaves the first result untouched", () => {
      const first = newPlanReducer(paste({ link: "abc" }), { type: "linkAccepted", checked });
      expect(newPlanReducer(first, { type: "linkAccepted", checked })).toBe(first);
    });
  });

  describe("back", () => {
    it("moves preview to paste, keeping the link with no error and no checked", () => {
      const next = newPlanReducer(preview({ link: "abc" }), { type: "back" });
      expect(next).toMatchObject({ step: "paste", link: "abc", linkError: null });
      expect(next).not.toHaveProperty("checked");
    });

    it("is ignored on paste", () => {
      const state = paste();
      expect(newPlanReducer(state, { type: "back" })).toBe(state);
    });

    it("a repeat is ignored", () => {
      const first = newPlanReducer(preview(), { type: "back" });
      expect(newPlanReducer(first, { type: "back" })).toBe(first);
    });
  });

  describe("daysPicked", () => {
    it("sets days on preview", () => {
      expect(newPlanReducer(preview(), { type: "daysPicked", days: 7 })).toMatchObject({
        step: "preview",
        days: 7,
      });
    });

    it("is ignored on paste", () => {
      const state = paste();
      expect(newPlanReducer(state, { type: "daysPicked", days: 7 })).toBe(state);
    });
  });

  describe("quickCheckSet", () => {
    it("sets quickCheck on preview", () => {
      expect(
        newPlanReducer(preview({ quickCheck: true }), { type: "quickCheckSet", quickCheck: false }),
      ).toMatchObject({ step: "preview", quickCheck: false });
    });

    it("is ignored on paste", () => {
      const state = paste();
      expect(newPlanReducer(state, { type: "quickCheckSet", quickCheck: false })).toBe(state);
    });
  });

  it("never mutates a frozen input", () => {
    const events = [
      { type: "linkChanged", link: "x" },
      { type: "linkRejected", message: "m" },
      { type: "linkAccepted", checked },
      { type: "back" },
      { type: "daysPicked", days: 2 },
      { type: "quickCheckSet", quickCheck: false },
    ] as const;
    for (const state of [paste(), preview()]) {
      for (const event of events) {
        expect(() => newPlanReducer(state, event)).not.toThrow();
      }
    }
  });
});

describe("getNewPlanStepIndex", () => {
  it("is 0 on paste and 1 on preview", () => {
    expect(getNewPlanStepIndex(paste())).toBe(0);
    expect(getNewPlanStepIndex(preview())).toBe(1);
  });
});
