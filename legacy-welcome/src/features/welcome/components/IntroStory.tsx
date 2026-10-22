import type { StyleProp, ViewStyle } from "react-native";

import { useStoryPhase } from "../hooks/use-story-phase";
import { STORY_BEATS } from "../logic/story";
import { ScreenFan } from "./ScreenFan";

export type IntroStoryProps = {
  /** Holds the story still on its opening (Reduce Motion). */
  paused: boolean;
  /** Holds the story still wherever it is (the screen being left). */
  frozen?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * The intro story, playing on its stage from the top. Everything it runs —
 * the story's beats, the scene clock, every animation — lives and dies with
 * it, so mounting it afresh (a new `key`) starts the story from the start.
 */
export function IntroStory({ paused, frozen = false, testID, style }: IntroStoryProps) {
  const phase = useStoryPhase(STORY_BEATS, paused, frozen);

  return (
    <ScreenFan
      phase={phase}
      frozen={frozen}
      {...(testID && { testID })}
      {...(style && { style })}
    />
  );
}
