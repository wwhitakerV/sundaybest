import { z } from "zod";

import { isoDateSchema } from "./common.js";

export const progressDayActivitySchema = z.object({
  date: isoDateSchema,
  completedDayCount: z.number().int().nonnegative(),
});

export const streakSchema = z.object({
  current: z.number().int().nonnegative(),
  longest: z.number().int().nonnegative(),
});

export const progressResponseSchema = z.object({
  today: isoDateSchema,
  weekStart: isoDateSchema,
  week: z.array(progressDayActivitySchema).length(7),
  streak: streakSchema,
});

export type ApiProgress = z.infer<typeof progressResponseSchema>;
