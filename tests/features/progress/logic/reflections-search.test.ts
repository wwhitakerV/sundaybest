import { buildReflections, searchReflections } from "@/features/progress/logic/reflections";
import { aReflectionPrompt } from "@tests/factories/api-lists";
import { uuid } from "@tests/factories/api-plans";

const GRACE = aReflectionPrompt({ id: uuid(1), question: "Where did you see grace?" });
const FEAR = aReflectionPrompt({
  id: uuid(2),
  question: "What are you afraid of?",
  reference: "Psalm 23",
  planTitle: "The Shepherd",
  planId: uuid(3),
});

const reflections = buildReflections(
  [GRACE, FEAR],
  [
    {
      reflectionId: uuid(1),
      answer: "At the hospital, with Mum.",
      answeredAt: "2026-09-01T10:00:00Z",
    },
    { reflectionId: uuid(2), answer: "Losing my job.", answeredAt: "2026-09-02T10:00:00Z" },
  ],
  { [uuid(2)]: [{ writtenOn: "2026-09-10", text: "It came true, and I was fine." }] },
);

const ids = (words: string) => searchReflections(reflections, words).map(({ id }) => id);

describe("searchReflections", () => {
  it("keeps every reflection with nothing typed", () => {
    expect(ids("  ")).toEqual([uuid(1), uuid(2)]);
  });

  it("finds a reflection by its question", () => {
    expect(ids("afraid")).toEqual([uuid(2)]);
  });

  it("finds a reflection by what was written", () => {
    expect(ids("hospital")).toEqual([uuid(1)]);
  });

  it("finds a reflection by a line added to it later", () => {
    expect(ids("came true")).toEqual([uuid(2)]);
  });

  it("finds a reflection by its passage", () => {
    expect(ids("psalm 23")).toEqual([uuid(2)]);
  });

  it("finds a reflection by its plan", () => {
    expect(ids("shepherd")).toEqual([uuid(2)]);
  });

  it("finds what was typed whatever its case", () => {
    expect(ids("GRACE")).toEqual([uuid(1)]);
  });

  it("finds nothing for words no reflection holds", () => {
    expect(ids("zebra")).toEqual([]);
  });
});
