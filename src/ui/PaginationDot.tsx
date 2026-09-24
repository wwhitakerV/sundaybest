import Animated from "react-native-reanimated";

import { usePaginationDot } from "./use-pagination-dot";

export type PaginationDotProps = {
  active: boolean;
  size: number;
  /** Its width while active — the pill's length, or `size` for a plain dot. */
  activeWidth: number;
  color: string;
  activeColor: string;
  testID?: string;
};

/**
 * One dot of a `DotPagination`: it takes the active colour at once and
 * springs its length into and out of being the active one.
 */
export function PaginationDot({
  active,
  size,
  activeWidth,
  color,
  activeColor,
  testID,
}: PaginationDotProps) {
  const widthStyle = usePaginationDot(active, size, activeWidth);

  return (
    <Animated.View
      testID={testID}
      style={[
        { height: size, borderRadius: size / 2, backgroundColor: active ? activeColor : color },
        widthStyle,
      ]}
    />
  );
}
