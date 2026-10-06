import { z, type ZodType } from "zod";

import { AppError } from "./errors.js";

export function parseWithSchema<T>(schema: ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const message = parsed.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join(".") || "request"}: ${issue.message}`)
      .join("; ");
    throw new AppError("VALIDATION_FAILED", message);
  }
  return parsed.data;
}

export const idParamSchema = z.object({ id: z.string().uuid() });
export const planParamSchema = z.object({ planId: z.string().uuid() });
export const generationParamSchema = z.object({ generationId: z.string().uuid() });
export const quizParamSchema = z.object({ quizId: z.string().uuid() });
export const attemptParamSchema = z.object({ attemptId: z.string().uuid() });
export const dayParamSchema = z.object({ planId: z.string().uuid(), dayNumber: z.coerce.number().int().min(1).max(7) });
export const dayStepParamSchema = dayParamSchema.extend({ step: z.enum(["read", "scripture", "reflect", "pray"]) });
