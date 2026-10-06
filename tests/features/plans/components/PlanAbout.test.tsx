import { render, screen, within } from "@tests/helpers/render";

import { PlanAbout, type PlanAboutProps } from "@/features/plans/components/PlanAbout";

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
});
