import { useState } from "react";
import { useNavigation, useRouter } from "expo-router";

import { useWordQuery } from "@/core/api/reader-queries";
import { selectionFeedback } from "@/core/haptics/haptics";
import {
  WORD_EMPTY,
  WORD_WITHOUT_CHART,
  WORD_WITH_CHART,
  describeMapLines,
  getBookPassages,
  getLatestBook,
  getStudiedBooks,
} from "../logic/word-map";

/**
 * The Word's view model: the Bible as lines, dark where the reader has been;
 * the books studied as chips, with their counts; the book picked — the one
 * studied last, until another is — and its passages in order, each with
 * its text. Picks a book from the map or the chips.
 */
export function useWordView() {
  const router = useRouter();
  const navigation = useNavigation();
  const query = useWordQuery();
  const passages = query.data?.passages ?? [];
  const books = getStudiedBooks(passages);
  const [picked, setPicked] = useState<string | null>(null);
  // The chart, shown or put away for more room to read (a small screen, a long list).
  const [chartShown, setChartShown] = useState(true);
  // The reader's pick holds while its book is studied; until then, the book studied last.
  const selected =
    picked !== null && books.some(({ book }) => book === picked) ? picked : getLatestBook(passages);

  return {
    loading: query.isPending,
    error: query.data === undefined ? query.error : null,
    retry: () => void query.refetch(),
    lines: describeMapLines(new Set(books.map(({ book }) => book))),
    chips: books.map(({ book, count }) => ({ label: book, count })),
    selected,
    rows: selected
      ? getBookPassages(passages, selected).map((passage) => ({
          key: passage.reference,
          reference: passage.reference,
          text: passage.text,
        }))
      : [],
    /** Before the first passage: what the page says instead of chips and a list. */
    empty: query.isSuccess && passages.length === 0 ? WORD_EMPTY : null,
    /** Picks a studied book, from the map or its chip. */
    select: (book: string) => {
      if (book === selected) return;
      selectionFeedback();
      setPicked(book);
    },
    back: () => router.back(),
    chartShown,
    withChart: WORD_WITH_CHART,
    withoutChart: WORD_WITHOUT_CHART,
    showChart: (shown: boolean) => {
      selectionFeedback();
      setChartShown(shown);
    },
    /** A finger on the map holds the page's back swipe, so sliding the map never leaves the page. */
    holdBackSwipe: (holding: boolean) => navigation.setOptions({ gestureEnabled: !holding }),
  } as const;
}
