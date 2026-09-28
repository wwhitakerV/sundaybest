/**
 * Mock data for every screen — one connected set of records, as `AppData`,
 * standing in for the local database until it holds real data.
 *
 * "Today" is `MOCK_TODAY` (Wednesday 23 September 2026). There is one plan
 * per image in `assets/images/mock/`, each built from a sermon named, titled,
 * and pictured after the same file:
 *
 * | Plan                                       | Status    | Days | Shows                                                                     |
 * | ------------------------------------------ | --------- | ---- | ------------------------------------------------------------------------- |
 * | Today I Choose to Be a Blessing            | active    | 6    | day 1 done (its quiz taken, one wrong), day 2 under way; a quiz every day |
 * | Break the Cycle of Negative Thinking       | completed | 7    | every day done, a quiz each: day 6's half-way, day 7's perfect            |
 * | Still Praying                              | ready     | 3    | not started, no Quick Check                                               |
 * | Overcome Temptation                        | ready     | 1    | saved to the library, quiz untaken                                        |
 * | The Church Must Not Partner with the World | ready     | 5    | the sample anyone can try                                                 |
 *
 * Their days, readings, and Scripture are placeholders until the real
 * database is connected. Nothing is being built at launch: a plan is drafted
 * and built only when one is made in New Plan.
 *
 * The active and sample plans' passages are also there in the King James
 * Version (`SCRIPTURE_VARIANTS`), for a user who picks it.
 *
 * Records point at each other by ID; each exists once, in its table. Only
 * facts are recorded — progress, streaks, and scores are worked out from them.
 */
import type { AppData, EntityTable, Id } from "@/types/domain";

import {
  BLESSING_DAYS,
  BLESSING_PRAYERS,
  BLESSING_QUIZ_ANSWERS,
  BLESSING_QUIZ_ATTEMPTS,
  BLESSING_QUIZ_QUESTIONS,
  BLESSING_QUIZZES,
  BLESSING_REFLECTIONS,
  BLESSING_SCRIPTURE,
  PLAN_BLESSING,
} from "./plan-today-i-choose-to-be-a-blessing";
import {
  NEGATIVE_THINKING_DAYS,
  NEGATIVE_THINKING_PRAYERS,
  NEGATIVE_THINKING_QUIZ_ANSWERS,
  NEGATIVE_THINKING_QUIZ_ATTEMPTS,
  NEGATIVE_THINKING_QUIZ_QUESTIONS,
  NEGATIVE_THINKING_QUIZZES,
  NEGATIVE_THINKING_REFLECTIONS,
  NEGATIVE_THINKING_SCRIPTURE,
  PLAN_NEGATIVE_THINKING,
} from "./plan-break-the-cycle-of-negative-thinking";
import {
  PLAN_TEMPTATION,
  TEMPTATION_DAYS,
  TEMPTATION_PRAYERS,
  TEMPTATION_QUIZ_QUESTIONS,
  TEMPTATION_QUIZZES,
  TEMPTATION_REFLECTIONS,
  TEMPTATION_SAVED,
  TEMPTATION_SCRIPTURE,
} from "./plan-overcome-temptation";
import {
  PLAN_STILL_PRAYING,
  STILL_PRAYING_DAYS,
  STILL_PRAYING_PRAYERS,
  STILL_PRAYING_REFLECTIONS,
  STILL_PRAYING_SCRIPTURE,
} from "./plan-still-praying";
import {
  PLAN_CHURCH_AND_WORLD,
  CHURCH_AND_WORLD_DAYS,
  CHURCH_AND_WORLD_PRAYERS,
  CHURCH_AND_WORLD_REFLECTIONS,
  CHURCH_AND_WORLD_SCRIPTURE,
} from "./plan-the-church-must-not-partner-with-the-world";
import { MOCK_LIBRARY_EXTRAS } from "./library";
import { SCRIPTURE_VARIANTS } from "./scripture-variants";
import { MOCK_SERMONS } from "./sermons";
import { MOCK_REMINDERS, MOCK_SETTINGS, MOCK_USER } from "./user";

export { MOCK_TODAY } from "./user";
export { SAMPLE_PLAN_ID } from "./plan-the-church-must-not-partner-with-the-world";

/** Records keyed by ID. */
function toTable<T extends { id: Id }>(records: readonly T[]): EntityTable<T> {
  return Object.fromEntries(records.map((record) => [record.id, record]));
}

export const MOCK_DATA: AppData = {
  user: MOCK_USER,
  settings: MOCK_SETTINGS,
  sermons: toTable(MOCK_SERMONS),
  plans: toTable([
    PLAN_BLESSING,
    PLAN_NEGATIVE_THINKING,
    PLAN_STILL_PRAYING,
    PLAN_TEMPTATION,
    PLAN_CHURCH_AND_WORLD,
  ]),
  planDays: toTable([
    ...BLESSING_DAYS,
    ...NEGATIVE_THINKING_DAYS,
    ...STILL_PRAYING_DAYS,
    ...TEMPTATION_DAYS,
    ...CHURCH_AND_WORLD_DAYS,
  ]),
  scripture: toTable([
    ...BLESSING_SCRIPTURE,
    ...NEGATIVE_THINKING_SCRIPTURE,
    ...STILL_PRAYING_SCRIPTURE,
    ...TEMPTATION_SCRIPTURE,
    ...CHURCH_AND_WORLD_SCRIPTURE,
    ...SCRIPTURE_VARIANTS,
  ]),
  reflections: toTable([
    ...BLESSING_REFLECTIONS,
    ...NEGATIVE_THINKING_REFLECTIONS,
    ...STILL_PRAYING_REFLECTIONS,
    ...TEMPTATION_REFLECTIONS,
    ...CHURCH_AND_WORLD_REFLECTIONS,
  ]),
  prayers: toTable([
    ...BLESSING_PRAYERS,
    ...NEGATIVE_THINKING_PRAYERS,
    ...STILL_PRAYING_PRAYERS,
    ...TEMPTATION_PRAYERS,
    ...CHURCH_AND_WORLD_PRAYERS,
  ]),
  quizzes: toTable([...BLESSING_QUIZZES, ...NEGATIVE_THINKING_QUIZZES, ...TEMPTATION_QUIZZES]),
  quizQuestions: toTable([
    ...BLESSING_QUIZ_QUESTIONS,
    ...NEGATIVE_THINKING_QUIZ_QUESTIONS,
    ...TEMPTATION_QUIZ_QUESTIONS,
  ]),
  quizAttempts: toTable([...BLESSING_QUIZ_ATTEMPTS, ...NEGATIVE_THINKING_QUIZ_ATTEMPTS]),
  quizAnswers: toTable([...BLESSING_QUIZ_ANSWERS, ...NEGATIVE_THINKING_QUIZ_ANSWERS]),
  reminders: toTable(MOCK_REMINDERS),
  library: toTable([TEMPTATION_SAVED, ...MOCK_LIBRARY_EXTRAS]),
  generation: null,
};
