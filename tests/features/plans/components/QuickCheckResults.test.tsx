import { render, screen, within } from "@tests/helpers/render";

import { QuickCheckResults } from "@/features/plans/components/QuickCheckResults";
import type { QuizReviewItem } from "@/features/plans/logic/quick-check-review";

const RIGHT: QuizReviewItem = {
  id: "q1",
  number: "01",
  kicker: "From the sermon",
  prompt: "What comes before obedience?",
  verse: null,
  result: "correct",
  yours: "Grace",
  rightAnswer: null,
  why: "The sermon puts grace first.",
};

const MISSED: QuizReviewItem = {
  id: "q2",
  number: "02",
  kicker: "Finish the verse",
  prompt: "For by ___ you have been saved.",
  verse: { before: "For by ", answer: "grace", after: " you have been saved." },
  result: "incorrect",
  yours: "works",
  rightAnswer: "grace",
  why: "Ephesians 2:8. Salvation is a gift.",
};

function renderResults() {
  return render(<QuickCheckResults testID="results" items={[RIGHT, MISSED]} />);
}

describe("QuickCheckResults", () => {
  it("tallies the answers right and the ones missed", async () => {
    renderResults();

    expect(await screen.findByTestId("results-right-count")).toHaveTextContent("1");
    expect(screen.getByTestId("results-missed-count")).toHaveTextContent("1");
  });

  it("reviews every question on a card of its own", async () => {
    renderResults();

    expect(await screen.findAllByTestId(/^results-question-q\d$/)).toHaveLength(2);
  });

  it("says whether each answer was right", async () => {
    renderResults();

    expect(await screen.findByTestId("results-question-q1-verdict")).toHaveTextContent("Right");
    expect(screen.getByTestId("results-question-q2-verdict")).toHaveTextContent("Missed");
  });

  it("shows a missed answer beside the right one", async () => {
    renderResults();

    const card = await screen.findByTestId("results-question-q2");
    expect(within(card).getByTestId("results-question-q2-yours")).toHaveTextContent("works");
    expect(within(card).getByTestId("results-question-q2-answer")).toHaveTextContent("grace");
  });

  it("gives no correction for a right answer", async () => {
    renderResults();

    expect(await screen.findByTestId("results-question-q1-yours")).toHaveTextContent("Grace");
    expect(screen.queryByTestId("results-question-q1-answer")).toBeNull();
  });

  it("sets a verse with its right word in place", async () => {
    renderResults();

    expect(await screen.findByTestId("results-question-q2-prompt")).toHaveTextContent(
      "For by grace you have been saved.",
    );
  });

  it("says why the right answer is right", async () => {
    renderResults();

    expect(await screen.findByText("Ephesians 2:8. Salvation is a gift.")).toBeVisible();
  });
});
