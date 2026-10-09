import { ABOUT_CARD, ABOUT_READING, ABOUT_TITLE, boldOnPage } from "@tests/helpers/type-on-page";
import { render, screen, fireEvent, within } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { privacyTopicHref } from "@/features/settings/logic/privacy-routes";
import { PrivacyPolicyScreen } from "@/features/settings/screens/PrivacyPolicyScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockBack = jest.fn<void, []>();
const mockPush = jest.fn<void, [ExpoRouter.Href]>();

beforeEach(() => {
  mockBack.mockClear();
  mockPush.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ back: mockBack, push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

describe("PrivacyPolicyScreen", () => {
  it("is named in the bar beside Back, like every Settings page", () => {
    render(<PrivacyPolicyScreen />);

    expect(within(screen.getByTestId("privacy-policy")).getByText("Privacy policy")).toBeVisible();
    expect(screen.queryByTestId("privacy-policy-hero")).toBeNull();
  });

  it("opens on its promise as the page's title, and a line in the Study's reading type", () => {
    render(<PrivacyPolicyScreen />);

    expect(screen.getByRole("header", { name: "Your study belongs to you." })).toHaveStyle(
      ABOUT_TITLE,
    );
    expect(
      screen.getByText(
        "SundayBest keeps only what it needs to build your plans and remember your progress.",
      ),
    ).toHaveStyle(ABOUT_READING);
  });

  it("answers the big three at a glance, on a card, each with what it means", () => {
    render(<PrivacyPolicyScreen />);

    const glance = screen.getByTestId("privacy-policy-glance");
    expect(glance).toHaveStyle(ABOUT_CARD);
    const card = within(glance);
    expect(card.getByText("No account required")).toBeVisible();
    expect(card.getByText("No name, email, or password. Ever.")).toBeVisible();
    expect(card.getByText("Your reflections stay on your iPhone")).toBeVisible();
    expect(card.getByText("What you write is never sent to us.")).toBeVisible();
    expect(card.getByText("No ads or tracking")).toBeVisible();
    expect(card.getByText("Nothing follows you across other apps or websites.")).toBeVisible();
  });

  it("opens each page of the details from a row, the complete policy last", () => {
    render(<PrivacyPolicyScreen />);

    expect(screen.getByRole("header", { name: "The details" })).toBeVisible();
    expect(screen.getByTestId("privacy-policy-details")).toHaveStyle(ABOUT_CARD);
    const rows: [string, Parameters<typeof privacyTopicHref>[0]][] = [
      ["What we keep", "keep"],
      ["What stays on your iPhone", "device"],
      ["How we use your data", "use"],
      ["Your controls", "controls"],
      ["The complete policy", "policy"],
    ];
    for (const [label, id] of rows) {
      fireEvent.press(screen.getByRole("button", { name: label }));
      expect(mockPush).toHaveBeenLastCalledWith(privacyTopicHref(id));
    }
  });

  it("says when the policy took effect, at its foot", () => {
    render(<PrivacyPolicyScreen />);

    expect(
      within(screen.getByTestId("privacy-policy-footnote")).getByText(
        "Effective October 7, 2026 · Privacy version 1.0",
      ),
    ).toHaveStyle({ textAlign: "center" });
  });

  it("sets nothing in bold", () => {
    render(<PrivacyPolicyScreen />);

    expect(boldOnPage("privacy-policy")).toEqual([]);
  });

  it("goes back to Settings when Back is pressed", () => {
    render(<PrivacyPolicyScreen />);

    fireEvent.press(screen.getByTestId("privacy-policy-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
