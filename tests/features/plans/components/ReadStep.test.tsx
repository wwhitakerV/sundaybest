import { render, screen } from "@tests/helpers/render";

import { ReadStep } from "@/features/plans/components/ReadStep";
import type { StudyReading } from "@/features/plans/types";

function reading(paragraphs: StudyReading["paragraphs"]): StudyReading {
  return { title: "When Your Soul Is Thirsty", paragraphs, sermonQuote: null, sermonClip: null };
}

const HEADED = reading([
  { heading: "Hope Is Not Denial", content: "Real pain is named." },
  { heading: "Psalm 42:3-5", content: "In verse 5, David speaks to his own soul." },
]);

describe("ReadStep", () => {
  it("heads the reading Read", () => {
    render(<ReadStep dayNumber={1} reading={HEADED} passageReference="Psalm 42:3-5" />);

    expect(screen.getByRole("header", { name: "Read" })).toBeVisible();
  });

  it("sets each paragraph under its own heading", () => {
    render(<ReadStep dayNumber={1} reading={HEADED} passageReference="Psalm 42:3-5" />);

    expect(screen.getByText("Hope Is Not Denial")).toBeVisible();
    expect(screen.getByText("Real pain is named.")).toBeVisible();
  });

  it("heads the passage's study Scripture study, from the paragraph headed by the passage", () => {
    render(<ReadStep dayNumber={1} reading={HEADED} passageReference="Psalm 42:3-5" />);

    expect(screen.getByRole("header", { name: "Scripture study" })).toBeVisible();
    expect(screen.getByTestId("study-read-scripture-study")).toHaveTextContent(
      /Psalm 42:3-5.*In verse 5/,
    );
  });

  it("reads a plan written before headings as it always did: no headings, no Scripture study", () => {
    render(
      <ReadStep
        dayNumber={1}
        reading={reading([{ heading: null, content: "Psalm 42 opens with longing." }])}
        passageReference="Psalm 42:1-2"
      />,
    );

    expect(screen.getByText("Psalm 42 opens with longing.")).toBeVisible();
    expect(screen.queryByRole("header", { name: "Scripture study" })).toBeNull();
    expect(screen.queryByTestId("study-read-paragraph-heading")).toBeNull();
  });
});
