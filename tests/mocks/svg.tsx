import { View } from "react-native";
import type { SvgProps } from "react-native-svg";

/** Any .svg import under Jest: a plain view in its place, keeping its props. */
// eslint-disable-next-line import/no-default-export -- stands in for an .svg import, whose only shape is a default export.
export default function Artwork(props: SvgProps) {
  return <View {...props} />;
}
