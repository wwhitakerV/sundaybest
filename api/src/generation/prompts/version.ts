import { promptVersionFor } from "./custom.js";

/** Recorded with every plan, so content can be traced to the prompts that wrote it. */
export const GENERATOR_VERSION = "sundaybest-openai-2";
/** The standard prompts' version, marked with the custom prompts' while they're on (see custom.ts). */
export const PROMPT_VERSION = promptVersionFor("sundaybest-staged-2");
