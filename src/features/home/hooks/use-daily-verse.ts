import { useRef, type RefObject } from "react";
import type { View } from "react-native";

import { useUserSettingsQuery } from "@/core/api/reader-queries";
import { selectionFeedback, tapFeedback } from "@/core/haptics/haptics";
import { logger } from "@/core/monitoring/logger";
import { openShareSheet, snapshotPng } from "@/core/sharing/share-sheet";
import { useLikedVerse } from "@/core/storage/liked-verse-queries";
import days from "../data/daily-verses.json";
import {
  describeDailyVerse,
  describeVerseShare,
  pickDailyVerse,
  verseTranslationFor,
} from "../logic/daily-verse";

/**
 * The verse of the day on Home: today's verse in the reader's translation (or
 * the BSB), and sharing it — a picture of its share card and its words, in
 * iOS's share sheet. The card owns its share card and hands it over when
 * tapped. A second tap while the sheet is opening does nothing. Liking it is
 * kept on the phone.
 */
export function useDailyVerse(today: string) {
  const settings = useUserSettingsQuery();
  const sharing = useRef(false);
  const day = pickDailyVerse(days, today);
  const like = useLikedVerse({ date: day?.date ?? today, reference: day?.reference ?? "" });
  if (!day) return null;
  const translation = verseTranslationFor(settings.data?.settings.bibleTranslation);

  return {
    ...describeDailyVerse(day, translation),
    liked: like.liked,
    /** The phone's likes have been read: the heart says what's so. */
    likeReady: like.ready,
    /** Likes the verse, or takes the like back. */
    toggleLike: () => {
      if (!like.ready) return;
      selectionFeedback();
      like.toggle();
    },
    /** Shares the verse: the picture of `shareCard`, and its words. */
    share: async (shareCard: RefObject<View | null>) => {
      if (sharing.current) return;
      sharing.current = true;
      tapFeedback();
      try {
        const png = await snapshotPng(shareCard);
        await openShareSheet({ message: describeVerseShare(day, translation), png });
      } catch {
        // The sheet didn't open: the page stays as it was, and a tap tries again.
        logger.warn("Verse of the day: the share sheet didn't open");
      } finally {
        sharing.current = false;
      }
    },
  };
}
