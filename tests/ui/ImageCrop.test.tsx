import { render, screen } from "@tests/helpers/render";

import { ImageCrop } from "@/ui/ImageCrop";

/** A stand-in for a bundled image: Jest resolves each to a number. */
const ART = 1;
const SIZE = { width: 1320, height: 495 };
const TROPHY = { x: 170, y: 50, width: 400, height: 380 };
/** It's hidden from VoiceOver, so queries have to be told to look. */
const HIDDEN = { includeHiddenElements: true };

describe("ImageCrop", () => {
  it("takes the shape of the region it shows", () => {
    render(<ImageCrop testID="a-crop" source={ART} size={SIZE} crop={TROPHY} />);

    expect(screen.getByTestId("a-crop", HIDDEN)).toHaveStyle({ aspectRatio: 400 / 380 });
  });

  it("frames just that region of the image", () => {
    render(<ImageCrop testID="a-crop" source={ART} size={SIZE} crop={TROPHY} />);

    expect(screen.getByTestId("a-crop-frame", HIDDEN).props).toMatchObject({
      minX: 170,
      minY: 50,
      vbWidth: 400,
      vbHeight: 380,
    });
    expect(screen.getByTestId("a-crop-image", HIDDEN)).toHaveProp("width", 1320);
    expect(screen.getByTestId("a-crop-image", HIDDEN)).toHaveProp("height", 495);
  });

  it("is decoration: VoiceOver passes over it, and it never takes touches", () => {
    render(<ImageCrop testID="a-crop" source={ART} size={SIZE} crop={TROPHY} />);

    const crop = screen.getByTestId("a-crop", HIDDEN);
    expect(crop).toHaveProp("accessibilityElementsHidden", true);
    expect(crop).toHaveProp("importantForAccessibility", "no-hide-descendants");
    expect(crop).toHaveProp("pointerEvents", "none");
  });

  it("shows the whole region, edge to edge, by default", () => {
    render(<ImageCrop testID="a-crop" source={ART} size={SIZE} crop={TROPHY} />);

    expect(screen.getByTestId("a-crop-image", HIDDEN).props.mask).toBeUndefined();
  });

  it("can dissolve its left edge into whatever is behind it", () => {
    render(<ImageCrop testID="a-crop" source={ART} size={SIZE} crop={TROPHY} fadeLeft={0.25} />);

    expect(screen.getByTestId("a-crop-image", HIDDEN).props.mask).toMatch(/^image-crop-mask-/);
  });
});
