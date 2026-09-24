import type { Id, Reflection } from "@/types/domain";

/** What the user has typed for each question this visit, by reflection ID. */
export type ReflectionDrafts = Readonly<Record<Id, string>>;

/** One change to write to the store: a first answer, a change to one, or one taken back. */
export type ReflectionWrite =
  | { kind: "save" | "update"; reflectionId: Id; answer: string }
  | { kind: "clear"; reflectionId: Id };

/**
 * What to write to the store for a day's drafts: a first answer where there
 * was none, a change where the answer differs from the one saved, and a
 * clear where the user emptied an answer — nothing for a question left
 * alone, a draft that matches, or a blank one on a question never answered.
 * In question order.
 */
export function getReflectionWrites(
  reflections: readonly Reflection[],
  drafts: ReflectionDrafts,
): ReflectionWrite[] {
  const typed = new Map(Object.entries(drafts));
  return reflections.flatMap((reflection): ReflectionWrite[] => {
    const draft = typed.get(reflection.id)?.trim();
    if (draft === undefined || draft === (reflection.answer ?? "")) return [];
    if (!draft) return [{ kind: "clear", reflectionId: reflection.id }];
    return [
      {
        kind: reflection.answer === null ? "save" : "update",
        reflectionId: reflection.id,
        answer: draft,
      },
    ];
  });
}
