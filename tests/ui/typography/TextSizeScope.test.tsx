import { render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { SFProBody } from "@/ui/typography/SFProBody";
import { TextField } from "@/ui/typography/TextField";
import { TextSizeScope } from "@/ui/typography/TextSizeScope";

const { body, reading } = lightTheme.typography;
const scaledLeading = (offset: number) =>
  Math.round((reading.lineHeight * (reading.fontSize + offset)) / reading.fontSize);

describe("TextSizeScope", () => {
  it("draws text inside it larger by its offset", () => {
    render(
      <TextSizeScope offset={4}>
        <SFProBody testID="text">Grace</SFProBody>
      </TextSizeScope>,
    );

    expect(screen.getByTestId("text")).toHaveStyle({ fontSize: body.fontSize + 4 });
  });

  it("scales the line height in proportion", () => {
    render(
      <TextSizeScope offset={4}>
        <SFProBody testID="text" variant="reading">
          Grace
        </SFProBody>
      </TextSizeScope>,
    );

    expect(screen.getByTestId("text")).toHaveStyle({
      fontSize: reading.fontSize + 4,
      lineHeight: scaledLeading(4),
    });
  });

  it("draws text smaller for a negative offset", () => {
    render(
      <TextSizeScope offset={-4}>
        <SFProBody testID="text" variant="reading">
          Grace
        </SFProBody>
      </TextSizeScope>,
    );

    expect(screen.getByTestId("text")).toHaveStyle({
      fontSize: reading.fontSize - 4,
      lineHeight: scaledLeading(-4),
    });
  });

  it("leaves text outside any scope as designed", () => {
    render(<SFProBody testID="text">Grace</SFProBody>);

    expect(screen.getByTestId("text")).toHaveStyle({ fontSize: body.fontSize });
  });

  it("leaves text as designed at an offset of zero", () => {
    render(
      <TextSizeScope offset={0}>
        <SFProBody testID="text">Grace</SFProBody>
      </TextSizeScope>,
    );

    expect(screen.getByTestId("text")).toHaveStyle({ fontSize: body.fontSize });
  });

  it("grows what's typed into a field too", () => {
    render(
      <TextSizeScope offset={4}>
        <TextField testID="field" value="Grace" />
      </TextSizeScope>,
    );

    expect(screen.getByTestId("field")).toHaveStyle({ fontSize: body.fontSize + 4 });
  });
});
