import { ABOUT_CARD, ABOUT_READING, ABOUT_TITLE, boldOnPage } from "@tests/helpers/type-on-page";
import { render, screen, fireEvent, within } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { MEET_THE_CREATOR } from "@/features/settings/logic/meet-the-creator";
import { MeetTheCreatorScreen } from "@/features/settings/screens/MeetTheCreatorScreen";
import { lightTheme } from "@/theme/tokens";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useIsFocused: () => true,
}));

const mockBack = jest.fn<void, []>();

beforeEach(() => {
  mockBack.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ back: mockBack } as unknown as ReturnType<typeof useRouter>);
});

describe("MeetTheCreatorScreen", () => {
  it("is named in the bar beside Back, like every Settings page", () => {
    render(<MeetTheCreatorScreen />);

    expect(
      within(screen.getByTestId("meet-the-creator")).getByText("Meet the creator"),
    ).toBeVisible();
  });

  it("introduces Walter on a card, as a plan's card introduces a sermon: his photo, then his name", () => {
    render(<MeetTheCreatorScreen />);

    const portrait = screen.getByTestId("meet-the-creator-portrait");
    expect(portrait).toHaveStyle(ABOUT_CARD);
    const card = within(portrait);
    expect(
      card.getByLabelText("Walter Whitaker, smiling, in a black cap and T-shirt"),
    ).toBeVisible();
    expect(card.getByRole("header", { name: "Walter Whitaker" })).toHaveStyle(ABOUT_TITLE);
  });

  it("says what he does and where, under his name", () => {
    render(<MeetTheCreatorScreen />);

    const card = within(screen.getByTestId("meet-the-creator-portrait"));
    expect(card.getByText("Creator, Engineer & Designer")).toBeVisible();
    expect(card.getByText("Dallas, TX")).toBeVisible();
  });

  it("opens his letter on a standfirst, as About this plan opens", () => {
    render(<MeetTheCreatorScreen />);

    expect(screen.getByText(MEET_THE_CREATOR.standfirst)).toHaveStyle({
      ...lightTheme.typography.standfirst,
      color: lightTheme.colors.text,
    });
  });

  it("sets the letter in the Study's reading type, under the Study's headings", () => {
    render(<MeetTheCreatorScreen />);

    const headings = MEET_THE_CREATOR.sections.flatMap(({ heading }) => (heading ? [heading] : []));
    for (const heading of headings) {
      expect(screen.getByRole("header", { name: heading })).toHaveStyle(
        lightTheme.typography.stepTitle,
      );
    }
    expect(screen.getByText(/^I'm Walter\./)).toHaveStyle(ABOUT_READING);
  });

  it("features one line in serif, on a soft card, as Scripture is", () => {
    render(<MeetTheCreatorScreen />);

    const quote = screen.getByTestId("meet-the-creator-quote");
    expect(quote).toHaveStyle(ABOUT_CARD);
    expect(
      within(quote).getByText("What we hear on Sunday should have a life beyond Sunday."),
    ).toHaveStyle(lightTheme.typography.standfirst);
  });

  it("lists the small decisions on a card", () => {
    render(<MeetTheCreatorScreen />);

    const list = screen.getByTestId("meet-the-creator-decisions");
    expect(list).toHaveStyle(ABOUT_CARD);
    expect(within(list).getByText("How long a study should take.")).toBeVisible();
  });

  it("signs off in his name", () => {
    render(<MeetTheCreatorScreen />);

    const signOff = within(screen.getByTestId("meet-the-creator-sign-off"));
    expect(signOff.getByText("Walter")).toHaveStyle(lightTheme.typography.editorialHeading);
    expect(signOff.queryByText("Built with conviction. For a life of conviction.")).toBeNull();
  });

  it("ends on its motto, on the closing band", () => {
    render(<MeetTheCreatorScreen />);

    expect(
      within(screen.getByTestId("meet-the-creator-band")).getByText(
        "Built with conviction. For a life of conviction.",
      ),
    ).toBeVisible();
  });

  it("sets nothing in bold", () => {
    render(<MeetTheCreatorScreen />);

    expect(boldOnPage("meet-the-creator")).toEqual([]);
  });

  it("goes back when Back is pressed", () => {
    render(<MeetTheCreatorScreen />);

    fireEvent.press(screen.getByTestId("meet-the-creator-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
