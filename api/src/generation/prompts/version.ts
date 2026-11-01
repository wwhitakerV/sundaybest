/** Recorded with every plan, so content can be traced to the prompts that wrote it. Bump both together. */
export const GENERATOR_VERSION = "sundaybest-openai-5";
/** The prompts' version: a plan written by older prompts is never reused for a new one. */
export const PROMPT_VERSION = "sundaybest-staged-5";
/** The title step's version: a sermon titled by another is titled again on its next plan. */
export const TITLE_VERSION = "sundaybest-title-1";
