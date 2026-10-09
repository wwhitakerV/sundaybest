import { ABOUT_CARD, ABOUT_READING, ABOUT_TITLE, boldOnPage } from "@tests/helpers/type-on-page";
import { render, screen, fireEvent, within } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { SermonRemovalScreen } from "@/features/settings/screens/SermonRemovalScreen";
import { lightTheme } from "@/theme/tokens";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockBack = jest.fn<void, []>();

beforeEach(() => {
  mockBack.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ back: mockBack } as unknown as ReturnType<typeof useRouter>);
});

describe("SermonRemovalScreen", () => {
  it("is named in the bar beside Back, then opens on its title and a line to read", () => {
    render(<SermonRemovalScreen />);

    expect(
      within(screen.getByTestId("sermon-removal")).getByText("Request sermon removal"),
    ).toBeVisible();
    expect(screen.getByRole("header", { name: "Remove a sermon from SundayBest." })).toHaveStyle(
      ABOUT_TITLE,
    );
    expect(
      screen.getByText(
        "If your church would rather a sermon not be used in SundayBest, tell us which one and how to reach you.",
      ),
    ).toHaveStyle(ABOUT_READING);
    expect(screen.queryByTestId("sermon-removal-hero")).toBeNull();
  });

  it("says what it needs on one card, under the Study's heading", () => {
    render(<SermonRemovalScreen />);

    expect(screen.getByRole("header", { name: "What we need" })).toHaveStyle(
      lightTheme.typography.stepTitle,
    );
    const needs = screen.getByTestId("sermon-removal-needs");
    expect(needs).toHaveStyle(ABOUT_CARD);
    for (const need of ["The sermon's link", "A church email", "One sermon per request"]) {
      expect(within(needs).getByText(need)).toBeVisible();
    }
  });

  it("takes the church, the sermon's link, an email, and a reason if there is one", () => {
    render(<SermonRemovalScreen />);

    expect(screen.getByRole("header", { name: "Your request" })).toBeVisible();
    expect(screen.getByLabelText("Church name")).toBeVisible();
    expect(screen.getByLabelText("Sermon or plan link")).toHaveProp("keyboardType", "url");
    expect(screen.getByLabelText("Church email")).toHaveProp("keyboardType", "email-address");
    expect(screen.getByLabelText("Reason")).toHaveProp("placeholder", "Reason (optional)");
  });

  it("holds Submit until there's a church, a link, and an email", () => {
    render(<SermonRemovalScreen />);

    expect(screen.getByTestId("sermon-removal-submit")).toBeDisabled();
    fireEvent.changeText(screen.getByLabelText("Church name"), "Grace Church");
    fireEvent.changeText(screen.getByLabelText("Sermon or plan link"), "https://youtu.be/x");
    expect(screen.getByTestId("sermon-removal-submit")).toBeDisabled();
    fireEvent.changeText(screen.getByLabelText("Church email"), "office@grace.org");

    expect(screen.getByTestId("sermon-removal-submit")).toBeEnabled();
  });

  it("asks for no members' private information, at its foot", () => {
    render(<SermonRemovalScreen />);

    expect(
      within(screen.getByTestId("sermon-removal-footnote")).getByText(
        "Please don't include members' private information.",
      ),
    ).toHaveStyle({ textAlign: "center" });
  });

  it("sets nothing in bold", () => {
    render(<SermonRemovalScreen />);

    expect(boldOnPage("sermon-removal")).toEqual([]);
  });

  it("goes back when Back is pressed", () => {
    render(<SermonRemovalScreen />);

    fireEvent.press(screen.getByTestId("sermon-removal-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
