import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { space, useTheme } from "@/theme";
import { BottomFade } from "@/ui/atoms/BottomFade";
import { TopFade } from "@/ui/atoms/TopFade";
import { FloatingDock } from "./FloatingDock";
import { GRADUAL_FADE, getFrameEdges, type FrameFoot, type HeaderFade } from "./frame-edges";
import { PAGE_INSET, PAGE_TOP } from "./Screen";

export type ScrollFrameProps = {
  testID: string;
  /** Floated over the top of the scroll: a step header, a title and its filters. */
  header?: ReactNode;
  /**
   * How the header meets what scrolls under it (`HeaderFade`): a short fade
   * below it by default; `"gradual"` inside its own block (Study's steps);
   * soft, across its last row and a little past (Plans' filters).
   */
  headerFade?: HeaderFade;
  /** The full-height, full-width scroller, its content inset by `SCROLL_INSET`. */
  children: ReactNode;
  /** The page's way on, in the dock where the tab bar's pill sits: one `Button`, or a bar's pill. */
  footer?: ReactNode;
  /** A verdict (`FeedbackPanel`) shown in the dock's place, pinned to the screen's bottom. */
  feedback?: ReactNode;
  /** Over everything, drawn last: a sheet, a floating close. */
  overlay?: ReactNode;
};

/** The page inset, on a scroller's content: `ScrollScreen` and `ListScreen` set it. */
export const SCROLL_INSET = { paddingHorizontal: PAGE_INSET } as const;

/** Between a header's parts: a title and its filters. */
const HEADER_GAP = space[12];

const FrameClearanceContext = createContext({ top: 0, bottom: 0 });

/**
 * How far in from the screen's top and bottom a frame's scroller starts and
 * ends its content, so it rests clear of the header, the dock, and their
 * fades. `ScrollScreen` and `ListScreen` add it.
 */
export function useFrameClearance(): { top: number; bottom: number } {
  return useContext(FrameClearanceContext);
}

/**
 * The frame every scrolling page shares (`ScrollScreen`, `ListScreen`,
 * `MilestoneScreen`). Its scroller runs the phone's full height and width;
 * the header floats over its top and the way on floats in the dock over its
 * foot — the tab bar's own container — each on the page's colour, fading
 * into the page. So what scrolls dissolves under both ends instead of
 * stopping at a line, and every page's top and foot look the same.
 */
export function ScrollFrame({
  testID,
  header,
  headerFade = "edge",
  children,
  footer,
  feedback,
  overlay,
}: ScrollFrameProps) {
  const theme = useTheme();
  const insets = useContext(SafeAreaInsetsContext);
  const insetTop = insets?.top ?? 0;
  const [headerRef, headerHeight, setHeaderHeight] = useHeaderHeight();
  const [panelHeight, setPanelHeight] = useState(0);

  const foot: FrameFoot = feedback
    ? { kind: "panel", height: panelHeight }
    : footer
      ? { kind: "dock" }
      : { kind: "none" };
  const edges = getFrameEdges({
    insetTop,
    insetBottom: insets?.bottom ?? 0,
    headerHeight: header ? headerHeight : 0,
    headerFade,
    foot,
  });

  return (
    <View testID={testID} style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <FrameClearanceContext.Provider
        value={{ top: edges.top.clearance, bottom: edges.bottom.clearance }}
      >
        {children}
      </FrameClearanceContext.Provider>

      <TopFade
        testID={`${testID}-top-fade`}
        height={edges.top.height}
        solidHeight={edges.top.solid}
        {...(edges.top.ramp && { ramp: edges.top.ramp })}
      />
      {header ? (
        <View
          ref={headerRef}
          testID={`${testID}-header`}
          onLayout={(event: LayoutChangeEvent) => setHeaderHeight(event.nativeEvent.layout.height)}
          style={[
            styles.header,
            { paddingTop: insetTop + PAGE_TOP },
            headerFade === "gradual" && styles.gradualRoom,
          ]}
        >
          {header}
        </View>
      ) : null}

      {foot.kind === "dock" ? null : (
        <View pointerEvents="none" style={[styles.bottomEdge, { height: edges.bottom.height }]}>
          <BottomFade
            testID={`${testID}-bottom-fade`}
            height={edges.bottom.height}
            solidHeight={edges.bottom.solid}
          />
        </View>
      )}
      {feedback ? (
        <View
          testID={`${testID}-panel`}
          onLayout={(event: LayoutChangeEvent) => setPanelHeight(event.nativeEvent.layout.height)}
          style={styles.panel}
        >
          {feedback}
        </View>
      ) : footer ? (
        <FloatingDock testID={`${testID}-dock`}>{footer}</FloatingDock>
      ) : null}

      {overlay}
    </View>
  );
}

/**
 * The floating header's measured height. `onLayout` is the usual way, but it
 * hasn't always arrived for a header inside a full-screen modal (Study), which
 * left the page's content under the header with no fade; so the header is
 * also measured directly once it's drawn. Either one landing is enough.
 */
function useHeaderHeight() {
  const ref = useRef<View>(null);
  const [value, setValue] = useState(0);
  const set = (height: number) => setValue((current) => (current === height ? current : height));

  useLayoutEffect(() => {
    ref.current?.measure((_x, _y, _width, height) => {
      if (height > 0) set(height);
    });
  });

  return [ref, value, set] as const;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // A gradual fade's ramp is the foot of the header's own block.
  gradualRoom: { paddingBottom: GRADUAL_FADE },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: PAGE_INSET,
    gap: HEADER_GAP,
  },
  bottomEdge: { position: "absolute", left: 0, right: 0, bottom: 0 },
  panel: { position: "absolute", left: 0, right: 0, bottom: 0 },
});
