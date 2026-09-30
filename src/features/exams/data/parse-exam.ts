import { z } from "zod";

import type { ExamInteractionKind } from "@/types/domain";
import { isAllowedPassageUrl } from "@/core/links/passage-url";
import type {
  Exam,
  ExamAnswerKey,
  ExamOption,
  ExamQuestion,
  OptionFeedback,
  PassageLink,
  QuestionReveal,
} from "../types";

/**
 * Parses an exam's content (schema v2) and fails closed: anything missing,
 * inconsistent, or unsupported yields a list of field paths — never their
 * values — and no exam. What passes is split in two: the `Exam` the screens
 * may show before any reveal, and a `QuestionReveal` per question holding its
 * key, rationales, feedback, and teaching. See ADR 0013.
 */

export type ParsedExam =
  | { ok: true; exam: Exam; reveals: QuestionReveal[] }
  | { ok: false; examId: string | null; issues: string[] };

const EXPLORE_ICONS = ["scripture", "people", "letter"] as const;
const KINDS = ["single_choice", "true_false", "multiple_select", "matching", "ordering"] as const;

/** The one scoring rule this app implements for each kind. */
function scoringFor(kind: ExamInteractionKind): string {
  switch (kind) {
    case "single_choice":
    case "true_false":
      return "exact_choice";
    case "multiple_select":
      return "exact_set";
    case "matching":
      return "exact_mapping";
    case "ordering":
      return "exact_sequence";
  }
}

const text = z.string().trim().min(1);
const option = z.object({ id: text, label: text });
const choice = option.extend({ rationale: text });
const link = z.object({ reference: text, url: z.string() });

const questionSchema = z.object({
  id: text,
  version: z.number().int().nonnegative(),
  examId: text,
  primaryConceptId: text,
  stem: text,
  passageRefs: z.array(text).min(1),
  whyCorrect: text,
  teaching: z.object({
    title: text,
    concept: text,
    biblicalGrounding: z.array(text).min(1),
    importantDistinction: text,
    rememberThis: text,
    matchFeedback: z.record(z.string(), text).optional(),
    stepFeedback: z.record(z.string(), text).optional(),
  }),
  sources: z.array(link.extend({ kind: z.string(), translation: z.string() })),
  interaction: z.object({
    kind: z.enum(KINDS),
    choices: z.array(choice).optional(),
    prompts: z.array(option).optional(),
    targets: z.array(option).optional(),
    steps: z.array(option).optional(),
    answerKey: z.unknown(),
    scoring: z.string(),
  }),
});

const contentSchema = z.object({
  schemaVersion: z.literal(2),
  exam: z.object({
    id: text,
    version: z.number().int().nonnegative(),
    domain: text,
    level: text,
    title: text,
    overview: text,
    questionCount: z.number().int().positive(),
    durationMinutes: z.tuple([z.number().positive(), z.number().positive()]),
    objectives: z.array(text),
    concepts: z.array(text),
    completionBehavior: z.object({ examMode: text, studyMode: text }),
    sourceScope: z.object({ scriptureLinks: z.array(link) }),
    questionIds: z.array(text),
    interactionAllocation: z.record(z.string(), z.number().int().nonnegative()),
    experience: z.object({
      grading: z.object({
        single_choice: z.string(),
        true_false: z.string(),
        multiple_select: z.string(),
        matching: z.string(),
        ordering: z.string(),
        partialCredit: z.literal(false),
      }),
      teaching: z.object({ actionLabel: text }),
      overview: z
        .object({
          question: text,
          explore: z.array(z.object({ title: text, passage: text, icon: z.enum(EXPLORE_ICONS) })),
        })
        .optional(),
      results: z.object({
        bands: z.array(z.object({ minPercent: z.number().min(0).max(100), label: text })).min(1),
        conceptLabelMinimumIndependentObservations: z.number().int().positive(),
      }),
    }),
  }),
  questions: z.array(questionSchema).min(1),
});

type Content = z.infer<typeof contentSchema>;
type Question = z.infer<typeof questionSchema>;

/** `["questions", 0, "id"]` → `"questions[0].id"`. */
function formatPath(path: readonly PropertyKey[]): string {
  const joined = path.reduce<string>(
    (acc, part) =>
      typeof part === "number" ? `${acc}[${part}]` : acc ? `${acc}.${String(part)}` : String(part),
    "",
  );
  return joined || "content";
}

function duplicateIndexes(ids: readonly string[]): number[] {
  return ids.flatMap((id, index) => (ids.indexOf(id) === index ? [] : [index]));
}

function sameMembers(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && new Set(a).size === a.length && b.every((id) => a.includes(id));
}

/** Parses a question's answer key for its kind, or null if it names anything the question doesn't have. */
function parseKey(question: Question): ExamAnswerKey | null {
  const {
    kind,
    choices = [],
    prompts = [],
    targets = [],
    steps = [],
    answerKey,
  } = question.interaction;
  const choiceIds = choices.map((entry) => entry.id);
  switch (kind) {
    case "single_choice":
    case "true_false": {
      const id = z.string().safeParse(answerKey);
      return id.success && choiceIds.includes(id.data) ? { kind, choiceId: id.data } : null;
    }
    case "multiple_select": {
      const ids = z.array(z.string()).min(1).safeParse(answerKey);
      if (!ids.success) return null;
      const valid =
        new Set(ids.data).size === ids.data.length &&
        ids.data.every((id) => choiceIds.includes(id));
      return valid ? { kind, choiceIds: ids.data } : null;
    }
    case "matching": {
      const map = z.record(z.string(), z.string()).safeParse(answerKey);
      if (!map.success) return null;
      const entries = new Map(Object.entries(map.data));
      const promptIds = prompts.map((entry) => entry.id);
      const targetIds = targets.map((entry) => entry.id);
      const paired = promptIds.map((promptId) => entries.get(promptId));
      const valid =
        sameMembers([...entries.keys()], promptIds) &&
        paired.every((targetId) => targetId !== undefined && targetIds.includes(targetId)) &&
        new Set(paired).size === paired.length;
      return valid
        ? {
            kind,
            pairs: promptIds.map((promptId) => ({
              promptId,
              targetId: entries.get(promptId) ?? "",
            })),
          }
        : null;
    }
    case "ordering": {
      const ids = z.array(z.string()).safeParse(answerKey);
      const stepIds = steps.map((entry) => entry.id);
      return ids.success && sameMembers(ids.data, stepIds) ? { kind, stepIds: ids.data } : null;
    }
  }
}

/** The options a kind needs, with the field each lives in. */
function optionGroups(question: Question): { field: string; options: ExamOption[] | undefined }[] {
  const { kind, choices, prompts, targets, steps } = question.interaction;
  switch (kind) {
    case "single_choice":
    case "true_false":
    case "multiple_select":
      return [{ field: "choices", options: choices }];
    case "matching":
      return [
        { field: "prompts", options: prompts },
        { field: "targets", options: targets },
      ];
    case "ordering":
      return [{ field: "steps", options: steps }];
  }
}

/** Feedback a matching or ordering question needs for each prompt or step. */
function feedbackIssues(question: Question, at: string): string[] {
  const { kind, prompts = [], steps = [] } = question.interaction;
  const [field, record, ids] =
    kind === "matching"
      ? ([
          "matchFeedback",
          question.teaching.matchFeedback,
          prompts.map((entry) => entry.id),
        ] as const)
      : kind === "ordering"
        ? ([
            "stepFeedback",
            question.teaching.stepFeedback,
            steps.map((entry) => entry.id),
          ] as const)
        : ([null, undefined, []] as const);
  if (field === null) return [];
  if (!record) return [`${at}.teaching.${field}`];
  const lines = new Map(Object.entries(record));
  return ids.filter((id) => !lines.has(id)).map((id) => `${at}.teaching.${field}.${id}`);
}

function questionIssues(question: Question, index: number, content: Content): string[] {
  const at = `questions[${index}]`;
  const issues: string[] = [];
  if (question.examId !== content.exam.id) issues.push(`${at}.examId`);

  for (const { field, options } of optionGroups(question)) {
    if (!options || options.length === 0) {
      issues.push(`${at}.interaction.${field}`);
      continue;
    }
    for (const dup of duplicateIndexes(options.map((entry) => entry.id))) {
      issues.push(`${at}.interaction.${field}[${dup}].id`);
    }
  }
  if (parseKey(question) === null) issues.push(`${at}.interaction.answerKey`);
  if (question.interaction.scoring !== scoringFor(question.interaction.kind)) {
    issues.push(`${at}.interaction.scoring`);
  }
  issues.push(...feedbackIssues(question, at));

  const sourced = new Set(question.sources.map((source) => source.reference));
  question.passageRefs.forEach((ref, refIndex) => {
    if (!sourced.has(ref)) issues.push(`${at}.passageRefs[${refIndex}]`);
  });
  question.teaching.biblicalGrounding.forEach((ref, refIndex) => {
    if (!sourced.has(ref)) issues.push(`${at}.teaching.biblicalGrounding[${refIndex}]`);
  });
  question.sources.forEach((source, sourceIndex) => {
    if (!isAllowedPassageUrl(source.url)) issues.push(`${at}.sources[${sourceIndex}].url`);
  });
  return issues;
}

function examIssues(content: Content): string[] {
  const { exam, questions } = content;
  const issues: string[] = [];
  const ids = questions.map((question) => question.id);

  const inOrder =
    ids.length === exam.questionIds.length && ids.every((id, i) => id === exam.questionIds.at(i));
  if (!inOrder) issues.push("exam.questionIds");
  if (exam.questionCount !== questions.length) issues.push("exam.questionCount");
  for (const dup of duplicateIndexes(ids)) issues.push(`questions[${dup}].id`);

  const allocation = new Map(Object.entries(exam.interactionAllocation));
  const tallied = KINDS.every(
    (kind) =>
      (allocation.get(kind) ?? 0) ===
      questions.filter((question) => question.interaction.kind === kind).length,
  );
  const unknownKinds = [...allocation.keys()].some(
    (kind) => !(KINDS as readonly string[]).includes(kind),
  );
  if (!tallied || unknownKinds) issues.push("exam.interactionAllocation");

  const [shortest, longest] = exam.durationMinutes;
  if (shortest > longest) issues.push("exam.durationMinutes");

  for (const kind of KINDS) {
    const grading = new Map(Object.entries(exam.experience.grading));
    if (grading.get(kind) !== scoringFor(kind)) issues.push(`exam.experience.grading.${kind}`);
  }

  const floors = exam.experience.results.bands.map((band) => band.minPercent);
  if (Math.min(...floors) !== 0 || new Set(floors).size !== floors.length) {
    issues.push("exam.experience.results.bands");
  }

  exam.sourceScope.scriptureLinks.forEach((entry, index) => {
    if (!isAllowedPassageUrl(entry.url))
      issues.push(`exam.sourceScope.scriptureLinks[${index}].url`);
  });

  const scope = new Set(exam.sourceScope.scriptureLinks.map((entry) => entry.reference));
  exam.experience.overview?.explore.forEach((item, index) => {
    if (!scope.has(item.passage)) issues.push(`exam.experience.overview.explore[${index}].passage`);
  });
  return issues;
}

function linksFor(refs: readonly string[], sources: readonly PassageLink[]): PassageLink[] {
  return refs.map((reference) => ({
    reference,
    url: sources.find((source) => source.reference === reference)?.url ?? "",
  }));
}

function toQuestion(question: Question, index: number): ExamQuestion {
  const { interaction } = question;
  const base = {
    id: question.id,
    version: question.version,
    number: index + 1,
    primaryConceptId: question.primaryConceptId,
    stem: question.stem,
    passages: linksFor(question.passageRefs, question.sources),
  };
  const strip = (options: readonly ExamOption[] = []) =>
    options.map(({ id, label }) => ({ id, label }));
  switch (interaction.kind) {
    case "single_choice":
    case "true_false":
    case "multiple_select":
      return { ...base, kind: interaction.kind, choices: strip(interaction.choices) };
    case "matching":
      return {
        ...base,
        kind: "matching",
        prompts: strip(interaction.prompts),
        targets: strip(interaction.targets),
      };
    case "ordering":
      return { ...base, kind: "ordering", steps: strip(interaction.steps) };
  }
}

function feedbackFor(question: Question): OptionFeedback[] {
  const { kind, choices = [], prompts = [], steps = [] } = question.interaction;
  const lines = (options: readonly ExamOption[], record: Record<string, string> | undefined) => {
    const byId = new Map(Object.entries(record ?? {}));
    return options.map((entry) => ({ optionId: entry.id, text: byId.get(entry.id) ?? "" }));
  };
  if (kind === "matching") return lines(prompts, question.teaching.matchFeedback);
  if (kind === "ordering") return lines(steps, question.teaching.stepFeedback);
  return choices.map((entry) => ({ optionId: entry.id, text: entry.rationale }));
}

function toReveal(question: Question, key: ExamAnswerKey): QuestionReveal {
  const { teaching } = question;
  return {
    questionId: question.id,
    kind: question.interaction.kind,
    key,
    whyCorrect: question.whyCorrect,
    feedback: feedbackFor(question),
    teaching: {
      title: teaching.title,
      concept: teaching.concept,
      grounding: linksFor(teaching.biblicalGrounding, question.sources),
      importantDistinction: teaching.importantDistinction,
      rememberThis: teaching.rememberThis,
    },
  };
}

function examIdOf(raw: unknown): string | null {
  const probe = z.object({ exam: z.object({ id: z.string() }) }).safeParse(raw);
  return probe.success ? probe.data.exam.id : null;
}

export function parseExamContent(raw: unknown): ParsedExam {
  const parsed = contentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = [...new Set(parsed.error.issues.map((issue) => formatPath(issue.path)))];
    return { ok: false, examId: examIdOf(raw), issues };
  }
  const content = parsed.data;
  const issues = [
    ...examIssues(content),
    ...content.questions.flatMap((question, index) => questionIssues(question, index, content)),
  ];
  if (issues.length > 0) return { ok: false, examId: content.exam.id, issues };

  const { exam } = content;
  const reveals = content.questions.flatMap((question) => {
    const key = parseKey(question);
    return key ? [toReveal(question, key)] : [];
  });
  return {
    ok: true,
    exam: {
      summary: {
        id: exam.id,
        version: exam.version,
        domain: exam.domain,
        level: exam.level,
        title: exam.title,
        overview: exam.overview,
        question: exam.experience.overview?.question ?? null,
        questionCount: exam.questionCount,
        durationMinutes: exam.durationMinutes,
        objectives: exam.objectives,
        explore: (exam.experience.overview?.explore ?? []).map(({ title, icon, passage }) => ({
          title,
          icon,
          passage: {
            reference: passage,
            url:
              exam.sourceScope.scriptureLinks.find((entry) => entry.reference === passage)?.url ??
              "",
          },
        })),
        sourceLinks: exam.sourceScope.scriptureLinks,
      },
      rules: {
        bands: [...exam.experience.results.bands].sort((a, b) => b.minPercent - a.minPercent),
        conceptMinimumObservations:
          exam.experience.results.conceptLabelMinimumIndependentObservations,
        actionLabel: exam.experience.teaching.actionLabel,
      },
      questions: content.questions.map(toQuestion),
    },
    reveals,
  };
}
