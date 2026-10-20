/** A key verse reads whole in four lines of the Scripture face: about this many characters. */
const KEY_VERSE_CHARACTERS = 90;

/**
 * The day's key verse, as Progress picks it: the first that reads whole in
 * four lines, or — when none is that short — the shortest. Never cut.
 */
export function pickKeyVerse(verses: readonly { number: number; text: string }[]): string | null {
  const fits = verses.find((verse) => verse.text.trim().length <= KEY_VERSE_CHARACTERS);
  if (fits) return fits.text.trim();
  const shortest = [...verses].sort((a, b) => a.text.length - b.text.length)[0];
  return shortest ? shortest.text.trim() : null;
}
