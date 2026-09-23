import { LinkPreviewScreen } from "./LinkPreviewScreen";
import type { MockScreenProps } from "./mock-page";

/** New Plan's second step, on the turn where its day chips lift off and the days are picked. */
export function CreatePlanMock({ elapsedMs }: MockScreenProps) {
  return <LinkPreviewScreen lift="days" elapsedMs={elapsedMs} />;
}
