import { StyleSheet, type StyleProp, type TextStyle } from "react-native";
import { screen } from "@testing-library/react-native";

import { lightTheme } from "@/theme/tokens";

/**
 * The type of every line a page draws below its bar (the app's own, the same
 * on every Settings page): each line's weight and face.
 */
export function typeOnPage(barTestID: string) {
  const isText = (node: { type: unknown }) => node.type === "Text";
  const inBar = new Set(screen.getByTestId(barTestID).findAll(isText));
  return screen.root
    .findAll(isText)
    .filter((node) => !inBar.has(node))
    .map((node) => {
      const style = StyleSheet.flatten(node.props.style as StyleProp<TextStyle>);
      return { weight: String(style.fontWeight ?? "400"), family: style.fontFamily ?? "SF Pro" };
    });
}

/** The lines on an About page set in bold: About's pages are regular, medium, and semibold only. */
export function boldOnPage(barTestID: string) {
  return typeOnPage(barTestID).filter(({ weight }) => !["400", "500", "600"].includes(weight));
}

/** An About page's title: the app's page title, SF Pro at medium. */
export const ABOUT_TITLE = lightTheme.typography.screenTitle;
/** Its words to read: the Study's reading type, in its grey. */
export const ABOUT_READING = {
  ...lightTheme.typography.reading,
  color: lightTheme.colors.textInactive,
};
/** The soft card its lists sit on, as Settings' own do. */
export const ABOUT_CARD = {
  backgroundColor: lightTheme.colors.surface,
  borderColor: lightTheme.colors.containerBorder,
};
