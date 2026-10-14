import type { LocalReflectionAnswer } from "@/core/storage/reflection-answers";

/**
 * The device's private reflection answers, in memory, for tests that render
 * the Daily Study — in place of `@/core/storage/reflection-answers`, which
 * needs the device database:
 *
 *     jest.mock("@/core/storage/reflection-answers", () =>
 *       jest.requireActual("@tests/mocks/reflection-answers"),
 *     );
 *
 * Plain functions, not `jest.fn`, so Jest's mock resets between tests leave
 * them working. `clearSavedAnswers()` empties the device.
 */
const saved = new Map<string, string>();

const AT = "2026-10-05T12:00:00.000Z";

/** What's saved on the device: each reflection's answer, by its id. */
export function savedAnswers(): ReadonlyMap<string, string> {
  return saved;
}

/** Empties the device of every answer. */
export function clearSavedAnswers(): void {
  saved.clear();
}

export function getReflectionAnswers(
  _userId: string,
  reflectionIds: readonly string[],
): Promise<Record<string, LocalReflectionAnswer>> {
  const found: Record<string, LocalReflectionAnswer> = {};
  for (const reflectionId of reflectionIds) {
    const answer = saved.get(reflectionId);
    if (answer !== undefined) {
      found[reflectionId] = { reflectionId, answer, answeredAt: AT, updatedAt: AT };
    }
  }
  return Promise.resolve(found);
}

export function saveReflectionAnswer(
  _userId: string,
  reflectionId: string,
  answer: string,
): Promise<void> {
  if (answer.length === 0) saved.delete(reflectionId);
  else saved.set(reflectionId, answer);
  return Promise.resolve();
}

export function deleteReflectionAnswers(
  _userId: string,
  reflectionIds: readonly string[],
): Promise<void> {
  for (const reflectionId of reflectionIds) saved.delete(reflectionId);
  return Promise.resolve();
}

export async function countReflectionAnswers(
  userId: string,
  reflectionIds: readonly string[],
): Promise<number> {
  const answers = await getReflectionAnswers(userId, reflectionIds);
  return Object.values(answers).filter(({ answer }) => answer.trim().length > 0).length;
}

export function countAllReflectionAnswers(_userId: string): Promise<number> {
  return Promise.resolve([...saved.values()].filter((answer) => answer.trim().length > 0).length);
}

export function getAllReflectionAnswers(_userId: string): Promise<Record<string, string>> {
  return Promise.resolve(Object.fromEntries(saved));
}

/** Every answer, oldest first: in the order saved, all written at one moment. */
export function getAllReflectionEntries(_userId: string): Promise<LocalReflectionAnswer[]> {
  return Promise.resolve(
    [...saved].map(([reflectionId, answer]) => ({
      reflectionId,
      answer,
      answeredAt: AT,
      updatedAt: AT,
    })),
  );
}
