import { useDeferredValue, useState } from "react";

/**
 * A search that narrows a list in place, its field on the keyboard: open,
 * the words typed, and what to search for — `query`, the words a render
 * behind, so typing never waits on the list. Put away with nothing typed,
 * it closes; its own X clears it and closes it.
 */
export function useListSearch({ onOpen }: { onOpen?: () => void } = {}) {
  const [searching, setSearching] = useState(false);
  const [words, setWords] = useState("");
  const query = useDeferredValue(words);

  const close = () => {
    setSearching(false);
    setWords("");
  };

  return {
    /** The field's up, on the keyboard. */
    searching,
    /** What's typed, as typed. */
    words,
    setWords,
    /** What to search the list for: the words, once the field has drawn them. */
    query,
    open: () => {
      onOpen?.();
      setSearching(true);
    },
    /** The keyboard put away: with nothing typed, the search closes. */
    leave: () => {
      if (words.trim().length === 0) close();
    },
    /** Its own X: the words cleared, the field gone. */
    close,
  } as const;
}
