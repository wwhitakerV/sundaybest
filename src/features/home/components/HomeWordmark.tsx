import { Pressable } from "react-native";

import { Wordmark } from "@/ui/atoms/Wordmark";

export type HomeWordmarkProps = {
  /** Development builds only: what a tap opens (the development actions). */
  onPress?: (() => void) | undefined;
};

/**
 * Home's wordmark. In a development build, tapped, it opens the development
 * actions (ADR 0035) — nothing is drawn for it, and nothing changes as it's
 * pressed; in any other build it's only the mark.
 */
export function HomeWordmark({ onPress }: HomeWordmarkProps) {
  if (!onPress) return <Wordmark />;
  return (
    <Pressable testID="home-dev-actions" onPress={onPress}>
      <Wordmark />
    </Pressable>
  );
}
