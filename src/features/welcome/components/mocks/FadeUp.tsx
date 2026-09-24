import { useContext, type ReactNode } from "react";
import Animated from "react-native-reanimated";

import { useFadeUpIn } from "../../hooks/use-fade-up-in";
import { ArrivalContext } from "./arrival-context";

export type FadeUpProps = {
  /** Its place down the page (0 = first): later ones rise in a little later. */
  order: number;
  /** A finished screen (as on a side phone): already in place. */
  still: boolean;
  children: ReactNode;
};

/**
 * One element of a mock screen's page, rising into place as the page
 * appears — so a new page's content arrives in a smooth cascade instead of
 * all at once. Only moves by translation; nothing is laid out differently.
 * On a screen sliding in (`ArrivalContext`) it's already in place: the slide
 * brings it in, and rising on top of that would look like a bounce.
 */
export function FadeUp({ order, still, children }: FadeUpProps) {
  const arriving = useContext(ArrivalContext);
  const style = useFadeUpIn(still || arriving, order);

  return <Animated.View style={style}>{children}</Animated.View>;
}
