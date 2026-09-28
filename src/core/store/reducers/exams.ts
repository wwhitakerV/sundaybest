import type { ExamAttempt } from "@/types/domain";

import type { AppAction } from "../actions";
import {
  getExamItemResponse,
  isExamResponseComplete,
  isExamResponseValid,
} from "../exam-responses";
import { getOpenExamAttempt, hasRevealedExamAnswers } from "../selectors/exams";
import type { AppState } from "../state";
import { findById, withRecord } from "../table";

type Action<Type extends AppAction["type"]> = Extract<AppAction, { type: Type }>;

/** An attempt that's under way, or null. */
function openAttempt(state: AppState, attemptId: string): ExamAttempt | null {
  const attempt = findById(state.examAttempts, attemptId);
  return attempt?.status === "inProgress" ? attempt : null;
}

function withAttempt(state: AppState, attempt: ExamAttempt): AppState {
  return { ...state, examAttempts: withRecord(state.examAttempts, attempt) };
}

/**
 * A new attempt, as a snapshot of the exam's version and questions. Not
 * while another in the same mode is under way. An Exam attempt started after
 * the exam's answers were revealed is Practice.
 */
export function startExamAttempt(state: AppState, action: Action<"exam/startAttempt">): AppState {
  const { attemptId, examId, examVersion, mode, items, at } = action;
  if (items.length === 0 || findById(state.examAttempts, attemptId)) return state;
  if (getOpenExamAttempt(state, examId, mode)) return state;
  return withAttempt(state, {
    id: attemptId,
    createdAt: at,
    updatedAt: at,
    examId,
    examVersion,
    mode,
    practice: mode === "exam" && hasRevealedExamAnswers(state, examId),
    items,
    responses: [],
    status: "inProgress",
    startedAt: at,
    completedAt: null,
    result: null,
  });
}

/**
 * A question's response, added or replaced — only one that fits the
 * question, and never once a Study answer's been checked or the attempt's
 * finished.
 */
export function recordExamResponse(
  state: AppState,
  action: Action<"exam/recordResponse">,
): AppState {
  const attempt = openAttempt(state, action.attemptId);
  const item = attempt?.items.find((entry) => entry.questionId === action.questionId);
  if (!attempt || !item || !isExamResponseValid(item, action.response)) return state;
  if (getExamItemResponse(attempt, item.questionId)?.check) return state;
  const others = attempt.responses.filter((entry) => entry.questionId !== item.questionId);
  return withAttempt(state, {
    ...attempt,
    responses: [
      ...others,
      {
        questionId: item.questionId,
        response: action.response,
        respondedAt: action.at,
        check: null,
      },
    ],
    updatedAt: action.at,
  });
}

/**
 * A Study answer, checked: locked, with whether it was right. Once, and only
 * when complete. That reveals the exam's answers, so an Exam attempt at the
 * same exam still under way becomes Practice too — it's no longer blind.
 */
export function checkExamResponse(state: AppState, action: Action<"exam/checkResponse">): AppState {
  const attempt = openAttempt(state, action.attemptId);
  if (!attempt || attempt.mode !== "study") return state;
  const item = attempt.items.find((entry) => entry.questionId === action.questionId);
  const existing = getExamItemResponse(attempt, action.questionId);
  if (!item || !existing || existing.check || !isExamResponseComplete(item, existing.response)) {
    return state;
  }
  const checked = withAttempt(state, {
    ...attempt,
    responses: attempt.responses.map((entry) =>
      entry === existing ? { ...entry, check: { at: action.at, correct: action.correct } } : entry,
    ),
    updatedAt: action.at,
  });
  const openExam = getOpenExamAttempt(checked, attempt.examId, "exam");
  if (!openExam || openExam.practice) return checked;
  return withAttempt(checked, { ...openExam, practice: true, updatedAt: action.at });
}

/**
 * An attempt finished, with its graded result — once. An Exam attempt can
 * finish with questions unanswered; a Study one only once every answer's
 * been checked.
 */
export function completeExamAttempt(
  state: AppState,
  action: Action<"exam/completeAttempt">,
): AppState {
  const attempt = openAttempt(state, action.attemptId);
  if (!attempt) return state;
  const allChecked = attempt.items.every(
    (item) => getExamItemResponse(attempt, item.questionId)?.check,
  );
  if (attempt.mode === "study" && !allChecked) return state;
  return withAttempt(state, {
    ...attempt,
    status: "completed",
    completedAt: action.at,
    result: action.result,
    updatedAt: action.at,
  });
}
