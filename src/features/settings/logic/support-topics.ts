/** What a message to support is about, and how its box asks for it. */
export const SUPPORT_TOPICS = [
  { value: "question", label: "Question", prompt: "What's your question?" },
  { value: "bug", label: "Bug", prompt: "What happened?" },
  { value: "idea", label: "Idea", prompt: "What's your idea?" },
] as const;

export type SupportTopic = (typeof SUPPORT_TOPICS)[number]["value"];
