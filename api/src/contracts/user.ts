import { z } from "zod";

import { apiIdSchema, isoDateTimeSchema } from "./common.js";

export const userSchema = z.object({
  id: apiIdSchema,
  displayName: z.string().trim().min(1).max(80).nullable(),
  onboardedAt: isoDateTimeSchema.nullable(),
  status: z.enum(["active", "deleted"]),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const getMeResponseSchema = z.object({ user: userSchema });

export const updateMeRequestSchema = z
  .object({
    displayName: z.string().trim().min(1).max(80).nullable().optional(),
  })
  .strict();

export const completeOnboardingResponseSchema = z.object({ user: userSchema });

export type ApiUser = z.infer<typeof userSchema>;
export type UpdateMeRequest = z.infer<typeof updateMeRequestSchema>;
