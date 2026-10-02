import { type STORY_CARDS, type StoryPhase } from "@/features/welcome/logic/story";
import {
  getCaption,
  getNavigation,
  getScreen,
  getScreenView,
} from "@/features/welcome/logic/story-screens";

const onStage = (card: (typeof STORY_CARDS)[number]["key"]): StoryPhase => ({
  kind: "focus",
  card,
});

describe("getScreen", () => {
  it("shows New Plan for pasting and picking days", () => {
    expect(getScreen({ kind: "arrive" })).toBe("newPlan");
    expect(getScreen(onStage("plan"))).toBe("newPlan");
  });

  it("shows the study session for read, scripture, reflect, and pray", () => {
    expect(getScreen(onStage("read"))).toBe("study");
    expect(getScreen(onStage("scripture"))).toBe("study");
    expect(getScreen(onStage("pray"))).toBe("study");
  });

  it("shows Quick Check last, and while the stage leaves", () => {
    expect(getScreen(onStage("quiz"))).toBe("quiz");
    expect(getScreen({ kind: "leave" })).toBe("quiz");
  });
});

describe("getNavigation — as the real app moves", () => {
  it("starts on the first screen with no transition", () => {
    expect(getNavigation({ kind: "arrive" })).toBe("cut");
    expect(getNavigation(onStage("paste"))).toBe("cut");
  });

  it("steps within New Plan from pasting to picking days", () => {
    expect(getNavigation(onStage("plan"))).toBe("step");
  });

  it("presents the study session as a modal after Create my plan", () => {
    expect(getNavigation(onStage("read"))).toBe("modal");
  });

  it("steps within the study session from read to scripture to reflect to pray", () => {
    expect(getNavigation(onStage("scripture"))).toBe("step");
    expect(getNavigation(onStage("reflect"))).toBe("step");
    expect(getNavigation(onStage("pray"))).toBe("step");
  });

  it("pushes Quick Check", () => {
    expect(getNavigation(onStage("quiz"))).toBe("push");
  });
});

describe("getScreenView", () => {
  it("shows the screen on the phone at its current step, on the turn's clock", () => {
    expect(getScreenView("study", onStage("reflect"), 900)).toEqual({ step: 2, elapsedMs: 900 });
  });

  it("opens the study session on its Read step", () => {
    expect(getScreenView("study", onStage("read"), 900)).toEqual({ step: 0, elapsedMs: 900 });
  });

  it("arrives with the first screen at its start", () => {
    expect(getScreenView("newPlan", { kind: "arrive" }, 900)).toEqual({ step: 0, elapsedMs: 0 });
  });

  it("shows a screen that's been left at its last step, finished", () => {
    expect(getScreenView("newPlan", onStage("read"), 900)).toEqual({
      step: 1,
      elapsedMs: Infinity,
    });
  });

  it("shows the last screen finished while the stage leaves", () => {
    expect(getScreenView("quiz", { kind: "leave" }, 0).elapsedMs).toBe(Infinity);
  });
});

describe("getCaption", () => {
  it("shows no step until the first turn", () => {
    expect(getCaption({ kind: "arrive" })).toEqual({ mode: "hidden" });
  });

  it("shows the step the screen on the phone illustrates", () => {
    expect(getCaption(onStage("plan"))).toEqual({ mode: "step", step: 1, word: null });
  });

  it('has both reading steps, Read and Scripture, stand for "Read"', () => {
    expect(getCaption(onStage("read"))).toEqual({ mode: "step", step: 2, word: 0 });
    expect(getCaption(onStage("scripture"))).toEqual({ mode: "step", step: 2, word: 0 });
  });

  it("picks out the item of step 3 each study screen stands for", () => {
    expect(getCaption(onStage("pray"))).toEqual({ mode: "step", step: 2, word: 2 });
  });

  it("keeps the last step up while the stage fades out", () => {
    expect(getCaption({ kind: "leave" })).toEqual({ mode: "step", step: 2, word: 3 });
  });
});
