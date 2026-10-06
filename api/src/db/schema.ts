import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userStatusEnum = pgEnum("user_status", ["active", "deleted"]);
export const themeEnum = pgEnum("theme_preference", ["system", "light", "dark"]);
export const textSizeEnum = pgEnum("text_size", ["small", "default", "large", "extraLarge"]);
export const bibleTranslationEnum = pgEnum("bible_translation", ["NIV", "ESV", "KJV", "NLT", "BSB"]);
export const readingPaperEnum = pgEnum("reading_paper", ["white", "ivory", "cream", "sepia", "dusk", "night"]);
export const reminderKindEnum = pgEnum("reminder_kind", ["dailyStudy", "quickCheck"]);
export const sermonPlatformEnum = pgEnum("sermon_platform", ["youtube"]);
export const transcriptStatusEnum = pgEnum("transcript_status", [
  "available",
  "autoCaptions",
  "processing",
  "unavailable",
]);
export const planVisibilityEnum = pgEnum("plan_visibility", ["private", "sample"]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", ["ready", "active", "completed", "archived"]);
export const studyStepEnum = pgEnum("study_step", ["read", "scripture", "reflect", "pray"]);
export const quizQuestionKindEnum = pgEnum("quiz_question_kind", ["multipleChoice", "finishTheVerse"]);
export const quizQuestionSourceEnum = pgEnum("quiz_question_source", ["sermon", "scripture"]);
export const quizAttemptStatusEnum = pgEnum("quiz_attempt_status", ["inProgress", "completed"]);
export const generationStatusEnum = pgEnum("generation_status", [
  "validating",
  "preparing",
  "processingSermon",
  "findingScripture",
  "writingDays",
  "buildingQuiz",
  "completed",
  "failed",
]);
export const generationJobStatusEnum = pgEnum("generation_job_status", ["queued", "running", "completed", "failed"]);
export const idempotencyStatusEnum = pgEnum("idempotency_status", ["pending", "completed"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: text("display_name"),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true, mode: "date" }),
  status: userStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
});

export const deviceInstallations = pgTable(
  "device_installations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    platform: text("platform").notNull().default("ios"),
    attestationKeyId: text("attestation_key_id").notNull(),
    publicKeyPem: text("public_key_pem").notNull(),
    signCount: integer("sign_count").notNull().default(0),
    appVersion: text("app_version"),
    timezone: text("timezone"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("device_installations_key_uidx").on(t.attestationKeyId),
    index("device_installations_user_idx").on(t.userId),
  ],
);

export const refreshSessions = pgTable(
  "refresh_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    installationId: uuid("installation_id").notNull().references(() => deviceInstallations.id, { onDelete: "cascade" }),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    rotatedAt: timestamp("rotated_at", { withTimezone: true, mode: "date" }),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("refresh_sessions_token_uidx").on(t.refreshTokenHash),
    index("refresh_sessions_installation_idx").on(t.installationId),
    index("refresh_sessions_user_idx").on(t.userId),
  ],
);

export const appAttestChallenges = pgTable(
  "app_attest_challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    keyId: text("key_id"),
    challengeHash: text("challenge_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("app_attest_challenges_hash_uidx").on(t.challengeHash),
    index("app_attest_challenges_key_idx").on(t.keyId),
    index("app_attest_challenges_expiry_idx").on(t.expiresAt),
  ],
);

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  theme: themeEnum("theme").notNull().default("system"),
  textSize: textSizeEnum("text_size").notNull().default("default"),
  bibleTranslation: bibleTranslationEnum("bible_translation").notNull().default("BSB"),
  defaultPlanLength: smallint("default_plan_length").notNull().default(6),
  quickCheckByDefault: boolean("quick_check_by_default").notNull().default(true),
  hapticsEnabled: boolean("haptics_enabled").notNull().default(true),
  readingTextOffset: smallint("reading_text_offset").notNull().default(0),
  readingPaper: readingPaperEnum("reading_paper").notNull().default("white"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const sermonSources = pgTable(
  "sermon_sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    platform: sermonPlatformEnum("platform").notNull().default("youtube"),
    externalId: text("external_id").notNull(),
    canonicalUrl: text("canonical_url").notNull(),
    title: text("title").notNull(),
    churchOrChannel: text("church_or_channel"),
    thumbnailUrl: text("thumbnail_url"),
    thumbnailColors: jsonb("thumbnail_colors").$type<string[]>().notNull().default([]),
    durationSeconds: integer("duration_seconds"),
    publishedOn: date("published_on", { mode: "string" }),
    transcriptStatus: transcriptStatusEnum("transcript_status").notNull().default("processing"),
    transcriptLanguage: text("transcript_language"),
    metadataFetchedAt: timestamp("metadata_fetched_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("sermon_sources_platform_external_uidx").on(t.platform, t.externalId)],
);

/** A recent Supadata search: the videos it returned for a term. Never who searched. */
export const sermonSearches = pgTable("sermon_searches", {
  /** The result limit and the normalized term, as `10:grace`. */
  query: text("query").primaryKey(),
  externalIds: jsonb("external_ids").$type<unknown>().notNull(),
  searchedAt: timestamp("searched_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const sermonTranscriptSegments = pgTable(
  "sermon_transcript_segments",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    sermonId: uuid("sermon_id").notNull().references(() => sermonSources.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    startMs: integer("start_ms").notNull(),
    endMs: integer("end_ms"),
    text: text("text").notNull(),
  },
  (t) => [
    uniqueIndex("transcript_sermon_sequence_uidx").on(t.sermonId, t.sequence),
    index("transcript_sermon_idx").on(t.sermonId),
  ],
);

export const scriptureReferences = pgTable(
  "scripture_references",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    book: text("book").notNull(),
    chapter: integer("chapter").notNull(),
    verseStart: integer("verse_start").notNull(),
    verseEnd: integer("verse_end").notNull(),
    canonicalReference: text("canonical_reference").notNull(),
  },
  (t) => [uniqueIndex("scripture_reference_canonical_uidx").on(t.canonicalReference)],
);

export const scriptureTexts = pgTable(
  "scripture_texts",
  {
    referenceId: uuid("reference_id").notNull().references(() => scriptureReferences.id, { onDelete: "cascade" }),
    translation: bibleTranslationEnum("translation").notNull(),
    verses: jsonb("verses").$type<Array<{ number: number; text: string }>>().notNull(),
    provider: text("provider").notNull(),
    providerVersion: text("provider_version"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.referenceId, t.translation] })],
);

export const plans = pgTable(
  "plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "cascade" }),
    sermonId: uuid("sermon_id").notNull().references(() => sermonSources.id),
    title: text("title").notNull(),
    visibility: planVisibilityEnum("visibility").notNull().default("private"),
    lengthDays: smallint("length_days").notNull(),
    quickCheckEnabled: boolean("quick_check_enabled").notNull(),
    /** About This Plan; null for plans generated before it existed. Parsed on read. */
    about: jsonb("about").$type<unknown>(),
    contentVersion: integer("content_version").notNull().default(1),
    readyAt: timestamp("ready_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("plans_owner_idx").on(t.ownerUserId), index("plans_visibility_idx").on(t.visibility)],
);

export const reminders = pgTable(
  "reminders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: reminderKindEnum("kind").notNull(),
    planId: uuid("plan_id").references(() => plans.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").notNull().default(false),
    localTime: time("local_time", { precision: 0 }).notNull().default("08:00:00"),
    weekdays: text("weekdays").array().notNull().default(["sun", "mon", "tue", "wed", "thu", "fri", "sat"]),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("reminders_user_idx").on(t.userId), index("reminders_plan_idx").on(t.planId)],
);


export const planGenerations = pgTable(
  "plan_generations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    requestKey: text("request_key").notNull(),
    planId: uuid("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
    sermonId: uuid("sermon_id").references(() => sermonSources.id),
    requestedLength: smallint("requested_length").notNull(),
    quickCheckEnabled: boolean("quick_check_enabled").notNull(),
    status: generationStatusEnum("status").notNull().default("preparing"),
    attemptCount: integer("attempt_count").notNull().default(1),
    /** 0–100, for the app's progress bar; only ever moves forward within an attempt. */
    progress: smallint("progress").notNull().default(0),
    /** When the reader dismissed it from the app's generation bar; until then it is current. */
    dismissedAt: timestamp("dismissed_at", { withTimezone: true, mode: "date" }),
    generatorVersion: text("generator_version"),
    promptVersion: text("prompt_version"),
    modelProvider: text("model_provider"),
    modelName: text("model_name"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }),
    finishedAt: timestamp("finished_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("plan_generations_user_request_uidx").on(t.userId, t.requestKey),
    index("plan_generations_user_idx").on(t.userId),
    index("plan_generations_plan_idx").on(t.planId),
    index("plan_generations_current_idx").on(t.userId, t.createdAt).where(sql`dismissed_at is null`),
    index("plan_generations_reuse_idx").on(t.sermonId, t.requestedLength, t.quickCheckEnabled, t.promptVersion)
      .where(sql`status = 'completed'`),
  ],
);

/** One row per generation attempt: why it failed and what the model used. Never content. */
export const generationAttempts = pgTable(
  "generation_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    generationId: uuid("generation_id").notNull().references(() => planGenerations.id, { onDelete: "cascade" }),
    /** "plan", "day 3", "quiz 3" for one model call; "total" for a whole attempt. */
    stage: text("stage").notNull().default("total"),
    round: integer("round").notNull(),
    attempt: integer("attempt").notNull(),
    outcome: text("outcome").notNull(),
    error: text("error"),
    model: text("model"),
    finishReason: text("finish_reason"),
    promptTokens: integer("prompt_tokens"),
    /** Of `prompt_tokens`, how many were billed at the cached rate. */
    cachedPromptTokens: integer("cached_prompt_tokens"),
    completionTokens: integer("completion_tokens"),
    reasoningTokens: integer("reasoning_tokens"),
    durationMs: integer("duration_ms").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("generation_attempts_generation_idx").on(t.generationId)],
);

/** An accepted step's model output, kept until its plan is published so a re-run resumes. */
export const generationSteps = pgTable(
  "generation_steps",
  {
    generationId: uuid("generation_id").notNull().references(() => planGenerations.id, { onDelete: "cascade" }),
    /** The step and what it was written from, as `day 3@<fingerprint>`. */
    step: text("step").notNull(),
    output: jsonb("output").$type<unknown>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.generationId, t.step] })],
);

export const generationJobs = pgTable(
  "generation_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    generationId: uuid("generation_id").notNull().references(() => planGenerations.id, { onDelete: "cascade" }),
    status: generationJobStatusEnum("status").notNull().default("queued"),
    attempts: integer("attempts").notNull().default(0),
    availableAt: timestamp("available_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    lockedAt: timestamp("locked_at", { withTimezone: true, mode: "date" }),
    lockedBy: text("locked_by"),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("generation_jobs_generation_uidx").on(t.generationId),
    index("generation_jobs_claim_idx").on(t.status, t.availableAt),
  ],
);

export const planDays = pgTable(
  "plan_days",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    planId: uuid("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
    dayNumber: smallint("day_number").notNull(),
    readingTitle: text("reading_title").notNull(),
    /** The day's thesis from the plan step; never shown. Null for days written before it was kept. */
    focus: text("focus"),
    readingParagraphs: jsonb("reading_paragraphs").$type<string[]>().notNull(),
    sermonQuote: text("sermon_quote"),
    clipStartSeconds: integer("clip_start_seconds"),
    clipEndSeconds: integer("clip_end_seconds"),
    /** SundayBest-chosen Scripture supporting the day ("Dive deeper"); parsed on read. */
    supportingScriptures: jsonb("supporting_scriptures").$type<unknown>().notNull().default([]),
    scriptureReferenceId: uuid("scripture_reference_id").notNull().references(() => scriptureReferences.id),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("plan_days_plan_day_uidx").on(t.planId, t.dayNumber), index("plan_days_plan_idx").on(t.planId)],
);

export const reflectionPrompts = pgTable(
  "reflection_prompts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    planDayId: uuid("plan_day_id").notNull().references(() => planDays.id, { onDelete: "cascade" }),
    position: smallint("position").notNull(),
    question: text("question").notNull(),
  },
  (t) => [uniqueIndex("reflection_prompts_day_position_uidx").on(t.planDayId, t.position)],
);

export const prayers = pgTable(
  "prayers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    planDayId: uuid("plan_day_id").notNull().references(() => planDays.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    text: text("text").notNull(),
  },
  (t) => [uniqueIndex("prayers_day_uidx").on(t.planDayId)],
);

export const quizzes = pgTable(
  "quizzes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    planId: uuid("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
    planDayId: uuid("plan_day_id").references(() => planDays.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("quizzes_plan_day_uidx").on(t.planDayId), index("quizzes_plan_idx").on(t.planId)],
);

export const quizQuestions = pgTable(
  "quiz_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quizId: uuid("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
    position: smallint("position").notNull(),
    kind: quizQuestionKindEnum("kind").notNull(),
    source: quizQuestionSourceEnum("source").notNull(),
    prompt: text("prompt").notNull(),
    scriptureReference: text("scripture_reference"),
    explanation: text("explanation"),
    /** Finish the verse's wording per bundled translation; null for other questions. Parsed on read. */
    variants: jsonb("variants").$type<unknown>(),
  },
  (t) => [uniqueIndex("quiz_questions_quiz_position_uidx").on(t.quizId, t.position)],
);

export const quizChoices = pgTable(
  "quiz_choices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    questionId: uuid("question_id").notNull().references(() => quizQuestions.id, { onDelete: "cascade" }),
    position: smallint("position").notNull(),
    label: text("label").notNull(),
    text: text("text").notNull(),
    isCorrect: boolean("is_correct").notNull().default(false),
  },
  (t) => [uniqueIndex("quiz_choices_question_position_uidx").on(t.questionId, t.position)],
);

export const userPlanEnrollments = pgTable(
  "user_plan_enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    planId: uuid("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
    status: enrollmentStatusEnum("status").notNull().default("ready"),
    startDate: date("start_date", { mode: "string" }),
    startedTimezone: text("started_timezone"),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("user_plan_enrollments_user_plan_uidx").on(t.userId, t.planId),
    index("user_plan_enrollments_user_status_idx").on(t.userId, t.status),
  ],
);

export const planDayProgress = pgTable(
  "plan_day_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    enrollmentId: uuid("enrollment_id").notNull().references(() => userPlanEnrollments.id, { onDelete: "cascade" }),
    planDayId: uuid("plan_day_id").notNull().references(() => planDays.id, { onDelete: "cascade" }),
    scheduledOn: date("scheduled_on", { mode: "string" }).notNull(),
    scheduledTimezone: text("scheduled_timezone").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    completedLocalDate: date("completed_local_date", { mode: "string" }),
    completedTimezone: text("completed_timezone"),
  },
  (t) => [
    uniqueIndex("plan_day_progress_enrollment_day_uidx").on(t.enrollmentId, t.planDayId),
    index("plan_day_progress_enrollment_idx").on(t.enrollmentId),
  ],
);

export const planStepProgress = pgTable(
  "plan_step_progress",
  {
    enrollmentId: uuid("enrollment_id").notNull().references(() => userPlanEnrollments.id, { onDelete: "cascade" }),
    planDayId: uuid("plan_day_id").notNull().references(() => planDays.id, { onDelete: "cascade" }),
    step: studyStepEnum("step").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.enrollmentId, t.planDayId, t.step] })],
);

export const savedPlans = pgTable(
  "saved_plans",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    planId: uuid("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
    savedAt: timestamp("saved_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.planId] })],
);

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    quizId: uuid("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
    status: quizAttemptStatusEnum("status").notNull().default("inProgress"),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
  },
  (t) => [index("quiz_attempts_user_quiz_idx").on(t.userId, t.quizId)],
);

export const quizAnswers = pgTable(
  "quiz_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    attemptId: uuid("attempt_id").notNull().references(() => quizAttempts.id, { onDelete: "cascade" }),
    questionId: uuid("question_id").notNull().references(() => quizQuestions.id, { onDelete: "cascade" }),
    choiceId: uuid("choice_id").notNull().references(() => quizChoices.id),
    correct: boolean("correct").notNull(),
    answeredAt: timestamp("answered_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("quiz_answers_attempt_question_uidx").on(t.attemptId, t.questionId)],
);

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    method: text("method").notNull(),
    path: text("path").notNull(),
    requestHash: text("request_hash").notNull(),
    status: idempotencyStatusEnum("status").notNull().default("pending"),
    responseStatus: integer("response_status"),
    responseBody: jsonb("response_body").$type<unknown>(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [
    uniqueIndex("idempotency_user_key_uidx").on(t.userId, t.key),
    index("idempotency_expiry_idx").on(t.expiresAt),
  ],
);
