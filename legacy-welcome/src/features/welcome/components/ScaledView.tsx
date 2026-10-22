import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

export type ScaledViewProps = {
  /** The size the children are laid out at. */
  designWidth: number;
  designHeight: number;
  /** The width to show them at; the height follows the same scale. */
  width: number;
  children: ReactNode;
  testID?: string;
};

/**
 * Lays its children out at their design size, then shrinks (or grows) the
 * result uniformly to `width`. Layout, text wrapping, and hit areas all
 * happen at design size, so a miniature is an exact, crisp copy — text is
 * still vector text, not an image. Takes up exactly the scaled size.
 */
export function ScaledView({
  designWidth,
  designHeight,
  width,
  children,
  testID,
}: ScaledViewProps) {
  const scale = width / designWidth;

  return (
    <View testID={testID} style={[styles.clip, { width, height: designHeight * scale }]}>
      <View
        style={[
          styles.design,
          { width: designWidth, height: designHeight, transform: [{ scale }] },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
  design: { transformOrigin: "top left" },
});
