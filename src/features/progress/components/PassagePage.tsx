import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";

import type { ApiWeekPassage } from "@/core/api/contracts";
import { PassageHeading } from "@/entities/scripture";
import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";
import { space } from "@/theme";
import { CompactButton } from "@/ui/atoms/CompactButton";
import { Divider } from "@/ui/atoms/Divider";
import { SerifBody } from "@/ui/typography/SerifBody";
import { SerifTitle } from "@/ui/typography/SerifTitle";
import { SFProBody } from "@/ui/typography/SFProBody";
import { usePassageWrote } from "../hooks/use-passage-wrote";
import type { PanelLook } from "../logic/week-view";
import { panelEnter } from "./panel-enter";

/** A key verse reads whole in four lines; a reflection shows its first three. */
const VERSE_LINES = 4;
const WROTE_LINES = 3;
/** When today's study has just been finished: its day's circle fills first, then this rises in. */
const REWARD_DELAY_MS = 260;

export type PassagePageProps = {
  passage: ApiWeekPassage | undefined;
  panel: PanelLook;
  /** Several plans on the day: the passage names its plan and reference. */
  named: boolean;
  /** On today. */
  isToday: boolean;
  /** The reader's Bible translation, in the pill beside the reference: "BSB". */
  translation: string;
  onOpen: (planId: string, dayNumber: number) => void;
};

/**
 * One passage in the day panel: done, its key verse — tapped, it opens the
 * study again — and what the reader wrote; otherwise what the day says, and
 * a way to read it when it can be read. It rises in as it arrives.
 */
export function PassagePage({
  passage,
  panel,
  named,
  isToday,
  translation,
  onOpen,
}: PassagePageProps) {
  const reduceMotion = useReduceMotion();
  const done = passage?.status === "done";
  const wrote = usePassageWrote(passage?.reflectionIds ?? [], done);
  const open = () => passage && onOpen(passage.planId, passage.dayNumber);

  return (
    <Animated.View
      key={passage?.status ?? "none"}
      entering={panelEnter(reduceMotion, done && isToday ? REWARD_DELAY_MS : 0)}
      style={{ gap: space[16] }}
    >
      {named && passage && (
        <SFProBody variant="label" tone="textSupporting" numberOfLines={1}>
          {passage.planTitle}
        </SFProBody>
      )}
      {/* As the Study heads a passage: its reference, and its translation in a pill. */}
      {passage && <PassageHeading reference={passage.reference} translation={translation} />}
      {panel.kind === "verse" ? (
        <>
          <Pressable
            testID="progress-passage-verse"
            accessibilityRole="button"
            accessibilityHint="Opens this study again"
            onPress={open}
          >
            <SerifBody variant="scripture" numberOfLines={VERSE_LINES}>
              {panel.verse ? `“${panel.verse}”` : ""}
            </SerifBody>
          </Pressable>
          {wrote && (
            <View style={{ gap: space[8] }}>
              <Divider style={{ marginBottom: space[8] }} />
              <SFProBody variant="detail" tone="textMuted">
                You wrote
              </SFProBody>
              <SerifBody variant="standfirst" tone="text" numberOfLines={WROTE_LINES}>
                {wrote}
              </SerifBody>
            </View>
          )}
        </>
      ) : (
        <View style={{ gap: space[12] }}>
          <SerifTitle variant="title">{panel.title}</SerifTitle>
          {panel.line && (
            <SFProBody variant="reading" tone="textInactive">
              {panel.line}
            </SFProBody>
          )}
          {panel.action && (
            <View style={{ alignSelf: "flex-start", marginTop: space[4] }}>
              <CompactButton
                testID="progress-passage-action"
                label={panel.action}
                tone="dark"
                onPress={open}
              />
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}
