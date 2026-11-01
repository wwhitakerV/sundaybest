import { z } from "zod";

/** The six faculties every interactive day has, in the order the board shows them. */
export const FACULTIES = ["see", "hear", "understand", "do", "speak", "examine"] as const;
export type Faculty = (typeof FACULTIES)[number];

/** What a point of the sermon is: something it teaches, warns, promises, or calls people to do. */
export const POINT_KINDS = ["teaching", "warning", "promise", "call"] as const;

/**
 * One point of the sermon, as the plan step inventories it: its kind, a short
 * statement of it, and where the sermon makes it — the transcript block, and
 * the second it starts in the video — never the caption's words. Every point
 * lands on a day; none is left out. Points kept before their times have none.
 */
export const sermonPointSchema = z.object({
  id: z.string().trim().min(1).max(40),
  kind: z.enum(POINT_KINDS),
  statement: z.string().trim().min(1).max(300),
  /** The transcript block it's made in, from 1 ("b12" is 12), or null when the model pointed at none. */
  block: z.number().int().positive().nullable().default(null),
  /** The second it starts in the video, or null when the transcript has no timing. */
  startSeconds: z.number().int().nonnegative().nullable().default(null),
});

/** A passage the sermon names in a day's part, beyond the day's own: a verse range, or a whole chapter. */
export const referencedPassageSchema = z.object({
  book: z.string().trim().min(1).max(80),
  chapter: z.number().int().min(1).max(150),
  verseStart: z.number().int().min(1).max(176).nullable(),
  verseEnd: z.number().int().min(1).max(176).nullable(),
  reference: z.string().trim().min(1).max(100),
});

/**
 * One faculty of a day: a question to the reader, answered from what the
 * sermon teaches at one of the day's points — written in the plan's voice,
 * never a caption quote — with an optional transition and reflection around
 * it, and a commitment.
 */
export const facultyEntrySchema = z.object({
  faculty: z.enum(FACULTIES),
  /** The day's point the answer comes from. */
  pointId: z.string().trim().min(1).max(40),
  transition: z.string().trim().min(1).max(120).nullable(),
  question: z.string().trim().min(1).max(200),
  answer: z.string().trim().min(1).max(600),
  reflection: z.string().trim().min(1).max(120).nullable(),
  commitment: z.string().trim().min(1).max(160),
});

/** A point of the day no faculty answers, listed at the day's end by its own statement. */
export const endingPointSchema = z.object({
  pointId: z.string().trim().min(1).max(40),
  statement: z.string().trim().min(1).max(300),
});

/**
 * What a day carries of the whole sermon: its points, the passages the sermon
 * names in its part beyond the day's own, which points each Read section
 * covers, and its six faculties with the points no faculty answers at its end.
 */
export const dayJourneySchema = z.object({
  pointIds: z.array(z.string().trim().min(1).max(40)).min(1),
  alsoReferenced: z.array(referencedPassageSchema).max(30),
  readingPointIds: z.array(z.array(z.string().trim().min(1).max(40))),
  faculties: z.array(facultyEntrySchema).length(FACULTIES.length),
  ending: z.array(endingPointSchema).max(20),
});

/** The plan's inventory of the sermon: every point it makes. */
export const planFormationSchema = z.object({
  points: z.array(sermonPointSchema).min(1).max(60),
});

export type SermonPoint = z.infer<typeof sermonPointSchema>;
export type EndingPoint = z.infer<typeof endingPointSchema>;
export type FacultyEntry = z.infer<typeof facultyEntrySchema>;
export type DayJourney = z.infer<typeof dayJourneySchema>;
export type PlanFormation = z.infer<typeof planFormationSchema>;
