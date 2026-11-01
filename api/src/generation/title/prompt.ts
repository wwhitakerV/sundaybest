import { z } from "zod";

// Structured Outputs supports only plain JSON Schema constraints; that every
// word is the video title's own, in order, is checked in `mapTitle`.
export const titleOutputSchema = z.object({
  title: z.string().min(1).max(200),
  series: z.string().min(1).max(200).nullable(),
  part: z.string().min(1).max(60).nullable(),
});

export type TitleOutput = z.infer<typeof titleOutputSchema>;

export const TITLE_INSTRUCTIONS = `# THIS STEP: THE SERMON'S TITLE

The message before this one is a YouTube video's title and its channel. Find the sermon's own title in it.

- **title**: the sermon's title. Leave out the speaker, the church or channel, dates, Scripture references, and anything added after a dash, a bar, or in brackets, unless it is the title itself. When the video's title has several parts, the sermon's title usually comes first, then its series.
- **series**: the name of the series the sermon is part of, or null when the title names none.
- **part**: which part of the series it is, worded as the title words it ("Part 2", "Week 3"), or null.
- Each field is one unbroken stretch of the video's title, word for word. Never add, change, reorder, or leave out a word inside it.
- If the task lists previousAttemptsRejected, an earlier answer failed those checks: fix exactly those problems.

Return only JSON matching the supplied response schema.`;
