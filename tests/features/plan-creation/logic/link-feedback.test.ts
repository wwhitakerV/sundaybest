import { aSermon } from "@tests/factories/api";
import { lookUpSermon } from "@/features/plan-creation/data/look-up-sermon";
import { getLinkFeedback } from "@/features/plan-creation/logic/link-feedback";
import {
  initialNewPlanState,
  newPlanReducer,
  type NewPlanState,
} from "@/features/plan-creation/logic/new-plan-flow";

const VALID = "https://youtube.com/watch?v=Qm81xRz4";
const start = initialNewPlanState({ days: 5, quickCheck: true });

function typed(link: string): NewPlanState {
  return newPlanReducer(start, { type: "linkChanged", link });
}

describe("getLinkFeedback", () => {
  it("says the link won't work once it was rejected", () => {
    const state = newPlanReducer(typed("last sunday"), {
      type: "linkRejected",
      message: "That doesn't look like a link.",
    });

    expect(getLinkFeedback(state)).toEqual({
      tone: "incorrect",
      title: "That link won't work",
      detail: "That doesn't look like a link.",
    });
  });

  it("cheers a valid link before Continue is pressed", () => {
    expect(getLinkFeedback(typed(VALID))).toEqual({
      tone: "correct",
      title: "Nice find!",
      detail: "Let's turn this sermon into your daily study.",
    });
  });

  it("stays quiet for an empty link", () => {
    expect(getLinkFeedback(start)).toBeNull();
  });

  it("stays quiet for a link that isn't valid yet and wasn't submitted", () => {
    expect(getLinkFeedback(typed("last sunday"))).toBeNull();
  });

  it("stays quiet in search mode, even with a valid link left in the field", () => {
    const state = newPlanReducer(typed(VALID), { type: "inputModeChanged", inputMode: "search" });

    expect(getLinkFeedback(state)).toBeNull();
  });

  it("cheers a sermon picked in search mode", () => {
    const searching = newPlanReducer(start, { type: "inputModeChanged", inputMode: "search" });
    const state = newPlanReducer(searching, {
      type: "searchResultSelected",
      selection: {
        id: "s1",
        checked: { sermonId: aSermon().id, url: VALID, sermon: lookUpSermon(aSermon()) },
      },
    });

    expect(getLinkFeedback(state)).toEqual({
      tone: "correct",
      title: "Nice find!",
      detail: "Let's turn this sermon into your daily study.",
    });
  });

  it("stays quiet in search mode until a sermon is picked", () => {
    const state = newPlanReducer(start, { type: "inputModeChanged", inputMode: "search" });

    expect(getLinkFeedback(state)).toBeNull();
  });

  it("stays quiet on the preview step", () => {
    const state: NewPlanState = {
      ...typed(VALID),
      step: "preview",
      checked: {
        url: VALID,
        sermon: { title: "T", church: "C", thumbnailUrl: "", durationSeconds: 60 },
      },
    } as NewPlanState;

    expect(getLinkFeedback(state)).toBeNull();
  });
});
