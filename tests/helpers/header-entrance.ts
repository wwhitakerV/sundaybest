import { screen } from "@tests/helpers/render";

/**
 * Whether the header button with this testID will play its entrance: its
 * animated wrapper (`<testID>-entrance`) has an entering animation set.
 */
export function hasHeaderEntrance(testID: string): boolean {
  return screen.getByTestId(`${testID}-entrance`).props.entering !== undefined;
}
