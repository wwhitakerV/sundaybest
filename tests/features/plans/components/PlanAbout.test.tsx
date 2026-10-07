import { render, screen, within } from "@tests/helpers/render";

import { PlanAbout, type PlanAboutProps } from "@/features/plans/components/PlanAbout";
import { fonts } from "@/theme/fonts";
import { lightTheme } from "@/theme/tokens";

const ABOUT: PlanAboutProps = {
  testID: "about",
  overview: ["Choosing God is a daily act.", "Each day studies one part of that choice."],
  scriptures: ["Joshua 24:15", "Romans 12"],
  takeaways: ["Grace comes before obedience.", "Choosing God is renewed each day."],
};

function renderAbout(props: Partial<PlanAboutProps> = {}) {
  return render(<PlanAbout {...ABOUT} {...props} />);
}

describe("PlanAbout", () => {
  it("heads the section About this plan", async () => {
    renderAbout();

    expect(await screen.findByRole("header", { name: "About this plan" })).toBeVisible();
  });

  it("shows each overview paragraph", async () => {
    renderAbout();

    expect(await screen.findByText("Choosing God is a daily act.")).toBeVisible();
    expect(screen.getByText("Each day studies one part of that choice.")).toBeVisible();
  });

  it("lists the Scriptures the sermon references, in order", async () => {
    renderAbout();

    const scriptures = await screen.findByTestId("about-scriptures");
    expect(within(scriptures).getByText("Scriptures referenced")).toBeVisible();
    const items = within(scriptures).getAllByTestId("about-scripture");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Joshua 24:15");
    expect(items[1]).toHaveTextContent("Romans 12");
  });

  it("lists the key takeaways", async () => {
    renderAbout();

    const takeaways = await screen.findByTestId("about-takeaways");
    expect(within(takeaways).getByText("Key takeaways")).toBeVisible();
    expect(within(takeaways).getByText("Grace comes before obedience.")).toBeVisible();
    expect(within(takeaways).getByText("Choosing God is renewed each day.")).toBeVisible();
  });

  it("leaves out Scriptures referenced when there are none", async () => {
    renderAbout({ scriptures: [] });

    expect(await screen.findByTestId("about-takeaways")).toBeVisible();
    expect(screen.queryByTestId("about-scriptures")).toBeNull();
  });

  it("opens the overview with its first paragraph as a serif standfirst", async () => {
    renderAbout();

    expect(await screen.findByTestId("about-standfirst")).toHaveTextContent(
      "Choosing God is a daily act.",
    );
    expect(screen.getByTestId("about-standfirst")).toHaveStyle({
      fontFamily: fonts.editorialBody,
    });
  });

  it("marks the section's start with a short rule in the accent", async () => {
    renderAbout();

    expect(await screen.findByTestId("about-rule")).toHaveStyle({
      backgroundColor: lightTheme.colors.accent,
    });
  });

  it("counts the Scriptures beside their label", async () => {
    renderAbout();

    expect(await screen.findByTestId("about-scriptures-count")).toHaveTextContent("2");
  });

  it("sets each Scripture as its own chip", async () => {
    renderAbout();

    const [first] = await screen.findAllByTestId("about-scripture-chip");
    expect(first).toHaveStyle({ backgroundColor: lightTheme.colors.segmentBackground });
  });

  it("numbers each takeaway, 01, 02, in the accent", async () => {
    renderAbout();

    const numbers = await screen.findAllByTestId("about-takeaway-number");
    expect(numbers[0]).toHaveTextContent("01");
    expect(numbers[1]).toHaveTextContent("02");
    expect(numbers[0]).toHaveStyle({ color: lightTheme.colors.accent });
  });

  it("gives each takeaway a card of its own", async () => {
    renderAbout();

    expect(await screen.findAllByTestId("about-takeaway-card")).toHaveLength(2);
  });

  it("sets each takeaway in a reading weight, not a bold one", async () => {
    renderAbout();

    const [first] = await screen.findAllByTestId("about-takeaway");
    expect(first).toHaveStyle({ fontWeight: "400" });
  });

  it("says how many takeaways there are on each card", async () => {
    renderAbout();

    const totals = await screen.findAllByTestId("about-takeaway-total");
    expect(totals[0]).toHaveTextContent("/ 02");
  });

  it("deals the takeaways one at a time, swiped sideways", async () => {
    renderAbout();

    expect(await screen.findByTestId("about-takeaways-deck")).toHaveProp("horizontal", true);
  });
});
