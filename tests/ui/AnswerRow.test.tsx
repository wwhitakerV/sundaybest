import { render, screen, fireEvent } from "@tests/helpers/render";

import { AnswerRow } from "@/ui/AnswerRow";

const noop = () => undefined;

describe("AnswerRow", () => {
  it("forwards testID to the outermost element", () => {
    render(
      <AnswerRow
        testID="an-answer-row"
        label="The holy Scriptures"
        marker={{ shape: "radio" }}
        state="idle"
        accessibilityLabel="The holy Scriptures"
        onPress={noop}
      />,
    );

    expect(screen.getByTestId("an-answer-row")).toBeVisible();
  });

  it("shows its label", () => {
    render(
      <AnswerRow
        testID="an-answer-row"
        label="The holy Scriptures"
        marker={{ shape: "radio" }}
        state="idle"
        accessibilityLabel="The holy Scriptures"
        onPress={noop}
      />,
    );

    expect(screen.getByText("The holy Scriptures")).toBeVisible();
  });

  it("shows its status text once given one", () => {
    render(
      <AnswerRow
        testID="an-answer-row"
        label="The holy Scriptures"
        marker={{ shape: "radio" }}
        state="correct"
        status="Correct answer"
        accessibilityLabel="The holy Scriptures. Correct answer."
        onPress={noop}
      />,
    );

    expect(screen.getByText("Correct answer")).toBeVisible();
  });

  it("shows its detail text once given one", () => {
    render(
      <AnswerRow
        testID="an-answer-row"
        label="The holy Scriptures"
        marker={{ shape: "radio" }}
        state="correct"
        detail="This is what the passage explicitly says."
        accessibilityLabel="The holy Scriptures"
        onPress={noop}
      />,
    );

    expect(screen.getByText("This is what the passage explicitly says.")).toBeVisible();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    render(
      <AnswerRow
        testID="an-answer-row"
        label="The holy Scriptures"
        marker={{ shape: "radio" }}
        state="idle"
        accessibilityLabel="The holy Scriptures"
        onPress={onPress}
      />,
    );

    fireEvent.press(screen.getByTestId("an-answer-row"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("cannot be pressed once it has no onPress", () => {
    render(
      <AnswerRow
        testID="an-answer-row"
        label="The holy Scriptures"
        marker={{ shape: "radio" }}
        state="correct"
        accessibilityLabel="The holy Scriptures"
      />,
    );

    // No onPress to call, and nothing throws for pressing it anyway — the
    // row itself reports it can't be interacted with.
    fireEvent.press(screen.getByTestId("an-answer-row"));

    expect(screen.getByTestId("an-answer-row")).toHaveProp(
      "accessibilityState",
      expect.objectContaining({ disabled: true }),
    );
  });

  it("reports the radio role as selected once its state is selected", () => {
    render(
      <AnswerRow
        testID="an-answer-row"
        label="B"
        marker={{ shape: "radio" }}
        state="selected"
        accessibilityLabel="B"
        accessibilityRole="radio"
        onPress={noop}
      />,
    );

    expect(screen.getByRole("radio", { selected: true })).toBeVisible();
  });

  it("does not report the radio role as selected while idle", () => {
    render(
      <AnswerRow
        testID="an-answer-row"
        label="B"
        marker={{ shape: "radio" }}
        state="idle"
        accessibilityLabel="B"
        accessibilityRole="radio"
        onPress={noop}
      />,
    );

    expect(screen.queryByRole("radio", { selected: true })).toBeNull();
  });

  it("reports the checkbox role as checked once its state is selected", () => {
    render(
      <AnswerRow
        testID="an-answer-row"
        label="B"
        marker={{ shape: "checkbox" }}
        state="selected"
        accessibilityLabel="B"
        accessibilityRole="checkbox"
        onPress={noop}
      />,
    );

    expect(screen.getByRole("checkbox", { checked: true })).toBeVisible();
  });

  it("shows a numbered marker's number", () => {
    render(
      <AnswerRow
        testID="an-answer-row"
        label="The Messiah suffers"
        marker={{ shape: "number", number: 2 }}
        state="idle"
        accessibilityLabel="The Messiah suffers, position 2"
        onPress={noop}
      />,
    );

    expect(screen.getByText("2")).toBeVisible();
  });

  it("shows no number for a step not yet placed", () => {
    render(
      <AnswerRow
        testID="an-answer-row"
        label="The Messiah suffers"
        marker={{ shape: "number", number: null }}
        state="idle"
        accessibilityLabel="The Messiah suffers, not placed"
        onPress={noop}
      />,
    );

    expect(screen.queryByText(/^\d+$/)).toBeNull();
  });

  it("shows its status text for a correct state, never colour alone", () => {
    render(
      <AnswerRow
        testID="an-answer-row"
        label="The holy Scriptures"
        marker={{ shape: "radio" }}
        state="correct"
        status="Correct answer"
        accessibilityLabel="The holy Scriptures. Correct answer."
        onPress={noop}
      />,
    );

    expect(screen.getByText("Correct answer")).toBeVisible();
  });

  it("shows its status text for an incorrect state, never colour alone", () => {
    render(
      <AnswerRow
        testID="an-answer-row"
        label="A written account of every apostle"
        marker={{ shape: "radio" }}
        state="incorrect"
        status="Your answer · Incorrect"
        accessibilityLabel="A written account of every apostle. Your answer, incorrect."
        onPress={noop}
      />,
    );

    expect(screen.getByText("Your answer · Incorrect")).toBeVisible();
  });

  it("carries an accessibility label a screen reader can use on its own", () => {
    render(
      <AnswerRow
        testID="an-answer-row"
        label="B"
        marker={{ shape: "radio" }}
        state="idle"
        accessibilityLabel="B. All who are weary and burdened."
        onPress={noop}
      />,
    );

    expect(screen.getByTestId("an-answer-row")).toHaveProp(
      "accessibilityLabel",
      "B. All who are weary and burdened.",
    );
  });
});

describe("AnswerRow once revealed", () => {
  it("still reports the user's own answer as selected", () => {
    render(
      <AnswerRow
        testID="an-answer-row"
        label="A written account of every apostle"
        marker={{ shape: "radio" }}
        state="incorrect"
        status="Your answer · Incorrect"
        picked
        accessibilityLabel="A written account of every apostle. Your answer · Incorrect."
        accessibilityRole="radio"
      />,
    );

    expect(screen.getByRole("radio", { selected: true })).toBeVisible();
  });
});
