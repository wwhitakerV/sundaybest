import { z } from "zod";
import { generatedDaySchema, generatedQuestionSchema, generatedScriptureSchema } from "./schema.js";

// Cross-field refinements belong to the server validator. The transport schema
// contains only the JSON Schema constraints supported by Structured Outputs.
const scripture = generatedScriptureSchema.safeExtend({ evidenceQuote: z.string().min(1).max(2000) });
const question = generatedQuestionSchema.safeExtend({
  evidenceQuote: z.string().min(1).max(2000).nullable(),
});
export const generationOutputSchema = z.object({
  title: z.string().min(1).max(300),
  days: z.array(generatedDaySchema.safeExtend({
    scripture,
    quickCheck: z.object({ title: z.string().min(1).max(200), questions: z.array(question).min(1).max(10) }).nullable(),
  })).min(1).max(7),
});
export type GenerationOutput = z.infer<typeof generationOutputSchema>;
