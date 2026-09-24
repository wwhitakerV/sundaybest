import { render, screen } from "@tests/helpers/render";

import { VideoThumbnail } from "@/ui/VideoThumbnail";

describe("VideoThumbnail", () => {
  it("forwards testID to the outermost view", () => {
    render(<VideoThumbnail testID="a-thumbnail" uri={null} />);

    expect(screen.getByTestId("a-thumbnail")).toBeVisible();
  });

  it("shows the video's length when given one", () => {
    render(<VideoThumbnail testID="a-thumbnail" uri={null} duration="42:18" />);

    expect(screen.getByText("42:18")).toBeVisible();
  });
});
