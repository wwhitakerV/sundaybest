import { LinkPreviewScreen } from "./LinkPreviewScreen";
import type { MockScreenProps } from "./mock-page";

/** New Plan's second step, days picked, on the turn where its sermon card lifts off and is tapped into. */
export function SermonPreviewMock({ elapsedMs }: MockScreenProps) {
  return <LinkPreviewScreen lift="sermon" elapsedMs={elapsedMs} />;
}
