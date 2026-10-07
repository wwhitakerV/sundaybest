/** A Read paragraph as the generator writes it now: its heading, then its text. */
export type ReadingParagraph = { heading: string; content: string };

/**
 * A Read paragraph as stored. Plans written before headings keep their
 * paragraphs as the plain text they were written as — never rewritten — so
 * either shape can come back from the database.
 */
export type StoredReadingParagraph = string | ReadingParagraph;

/** A Read paragraph as the app gets it: an old plain one has no heading. */
export type ApiReadingParagraph = { heading: string | null; content: string };

/** A stored paragraph in the API's one shape, its words untouched. */
export function readingParagraphForApi(paragraph: StoredReadingParagraph): ApiReadingParagraph {
  return typeof paragraph === "string"
    ? { heading: null, content: paragraph }
    : { heading: paragraph.heading, content: paragraph.content };
}

/** Every word of a stored paragraph — its heading, then its content — for counting or checking. */
export function readingParagraphText(paragraph: StoredReadingParagraph): string {
  return typeof paragraph === "string" ? paragraph : `${paragraph.heading} ${paragraph.content}`;
}
