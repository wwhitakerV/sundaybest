import { space } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { SerifBody } from "@/ui/typography/SerifBody";

/** An About page's one strong line, in serif on a soft card — as the Study sets Scripture. */
export function AboutCallout({ text, testID }: { text: string; testID: string }) {
  return (
    <Card edge={false} testID={testID} style={{ padding: space[24] }}>
      <SerifBody variant="standfirst" tone="text">
        {text}
      </SerifBody>
    </Card>
  );
}
