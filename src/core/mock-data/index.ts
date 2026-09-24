/**
 * Mock data for every screen — one connected set of records, as `AppData`,
 * standing in for the local database until it holds real data.
 *
 * "Today" is `MOCK_TODAY` (Wednesday 23 September 2026). The plans cover
 * every state a plan can be in:
 *
 * | Plan                         | Status     | Days | Shows                                  |
 * | ---------------------------- | ---------- | ---- | -------------------------------------- |
 * | Choose Whom You Will Serve   | active     | 6    | day 1 done, day 2 under way, quizzes   |
 * | Give Thanks in All Things    | completed  | 7    | every day done, perfect Quick Check    |
 * | Faith Through the Storm      | ready      | 3    | not started, no Quick Check            |
 * | Come to Me and Rest          | ready      | 1    | saved to the library, quiz untaken     |
 * | God Won't Leave You (sample) | ready      | 5    | the sample anyone can try              |
 * | Salt and Light               | draft      | —    | newly created in New Plan              |
 * | Who Is My Neighbor?          | generating | —    | being built (`MOCK_DATA.generation`)   |
 *
 * The active and sample plans' passages are also there in the King James
 * Version (`SCRIPTURE_VARIANTS`), for a user who picks it.
 *
 * Records point at each other by ID; each exists once, in its table. Only
 * facts are recorded — progress, streaks, and scores are worked out from them.
 */
import type { AppData, EntityTable, Id } from "@/types/domain";

import {
  CHOOSE_DAYS,
  CHOOSE_PRAYERS,
  CHOOSE_QUIZ_ANSWERS,
  CHOOSE_QUIZ_ATTEMPTS,
  CHOOSE_QUIZ_QUESTIONS,
  CHOOSE_QUIZZES,
  CHOOSE_REFLECTIONS,
  CHOOSE_SCRIPTURE,
  PLAN_CHOOSE,
} from "./plan-choose";
import {
  GRATITUDE_DAYS,
  GRATITUDE_PRAYERS,
  GRATITUDE_QUIZ_ANSWERS,
  GRATITUDE_QUIZ_ATTEMPTS,
  GRATITUDE_QUIZ_QUESTIONS,
  GRATITUDE_QUIZZES,
  GRATITUDE_REFLECTIONS,
  GRATITUDE_SCRIPTURE,
  PLAN_GRATITUDE,
} from "./plan-gratitude";
import {
  PLAN_REST,
  REST_DAYS,
  REST_PRAYERS,
  REST_QUIZ_QUESTIONS,
  REST_QUIZZES,
  REST_REFLECTIONS,
  REST_SAVED,
  REST_SCRIPTURE,
} from "./plan-rest";
import {
  PLAN_STORM,
  STORM_DAYS,
  STORM_PRAYERS,
  STORM_REFLECTIONS,
  STORM_SCRIPTURE,
} from "./plan-storm";
import {
  PLAN_SAMPLE,
  SAMPLE_DAYS,
  SAMPLE_PRAYERS,
  SAMPLE_REFLECTIONS,
  SAMPLE_SCRIPTURE,
} from "./plan-sample";
import { MOCK_GENERATION, PLAN_NEIGHBOR, PLAN_SALT } from "./plans-pending";
import { MOCK_LIBRARY_EXTRAS } from "./library";
import { SCRIPTURE_VARIANTS } from "./scripture-variants";
import { MOCK_SERMONS } from "./sermons";
import { MOCK_REMINDERS, MOCK_SETTINGS, MOCK_USER } from "./user";

export { MOCK_TODAY } from "./user";
export { SAMPLE_PLAN_ID } from "./plan-sample";

/** Records keyed by ID. */
function toTable<T extends { id: Id }>(records: readonly T[]): EntityTable<T> {
  return Object.fromEntries(records.map((record) => [record.id, record]));
}

export const MOCK_DATA: AppData = {
  user: MOCK_USER,
  settings: MOCK_SETTINGS,
  sermons: toTable(MOCK_SERMONS),
  plans: toTable([
    PLAN_CHOOSE,
    PLAN_GRATITUDE,
    PLAN_STORM,
    PLAN_REST,
    PLAN_SALT,
    PLAN_NEIGHBOR,
    PLAN_SAMPLE,
  ]),
  planDays: toTable([
    ...CHOOSE_DAYS,
    ...GRATITUDE_DAYS,
    ...STORM_DAYS,
    ...REST_DAYS,
    ...SAMPLE_DAYS,
  ]),
  scripture: toTable([
    ...CHOOSE_SCRIPTURE,
    ...GRATITUDE_SCRIPTURE,
    ...STORM_SCRIPTURE,
    ...REST_SCRIPTURE,
    ...SAMPLE_SCRIPTURE,
    ...SCRIPTURE_VARIANTS,
  ]),
  reflections: toTable([
    ...CHOOSE_REFLECTIONS,
    ...GRATITUDE_REFLECTIONS,
    ...STORM_REFLECTIONS,
    ...REST_REFLECTIONS,
    ...SAMPLE_REFLECTIONS,
  ]),
  prayers: toTable([
    ...CHOOSE_PRAYERS,
    ...GRATITUDE_PRAYERS,
    ...STORM_PRAYERS,
    ...REST_PRAYERS,
    ...SAMPLE_PRAYERS,
  ]),
  quizzes: toTable([...CHOOSE_QUIZZES, ...GRATITUDE_QUIZZES, ...REST_QUIZZES]),
  quizQuestions: toTable([
    ...CHOOSE_QUIZ_QUESTIONS,
    ...GRATITUDE_QUIZ_QUESTIONS,
    ...REST_QUIZ_QUESTIONS,
  ]),
  quizAttempts: toTable([...CHOOSE_QUIZ_ATTEMPTS, ...GRATITUDE_QUIZ_ATTEMPTS]),
  quizAnswers: toTable([...CHOOSE_QUIZ_ANSWERS, ...GRATITUDE_QUIZ_ANSWERS]),
  reminders: toTable(MOCK_REMINDERS),
  library: toTable([REST_SAVED, ...MOCK_LIBRARY_EXTRAS]),
  generation: MOCK_GENERATION,
};
