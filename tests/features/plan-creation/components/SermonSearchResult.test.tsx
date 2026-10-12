import { render, screen } from "@tests/helpers/render";

import { aSermon } from "@tests/factories/api";
import { SermonSearchResult } from "@/features/plan-creation/components/SermonSearchResult";
import { toSermonPreview } from "@/features/plan-creation/data/search-sermons";

describe("SermonSearchResult", () => {
  it("is a list card: 24 corners, as every card in a list is", () => {
    render(
      <SermonSearchResult
        testID="result"
        result={{ id: "s-1", url: "https://example.com/s-1", sermon: toSermonPreview(aSermon()) }}
        selected={false}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByTestId("result")).toHaveStyle({ borderRadius: 24 });
  });
});
