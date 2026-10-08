import { render, screen, fireEvent, within } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { privacyTopicHref } from "@/features/settings/logic/privacy-routes";
import { PrivacyPolicyScreen } from "@/features/settings/screens/PrivacyPolicyScreen";
import { lightTheme } from "@/theme/tokens";

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

const SHORT_VERSION = [
  { topic: "keep", label: "What we keep" },
  { topic: "device", label: "What stays on your iPhone" },
  { topic: "use", label: "How we use your data" },
  { topic: "controls", label: "Your controls" },
] as const;

describe("PrivacyPolicyScreen", () => {
  it("is addressable as privacy-policy-screen", () => {
    render(<PrivacyPolicyScreen />);

    expect(screen.getByTestId("privacy-policy-screen")).toBeVisible();
  });

  it("names the page in the bar beside Back, once", () => {
    render(<PrivacyPolicyScreen />);

    expect(within(screen.getByTestId("privacy-policy")).getByText("Privacy policy")).toBeVisible();
    expect(screen.getAllByText("Privacy policy")).toHaveLength(1);
  });

  it("opens on its promise: a red eyebrow, a serif statement, and a line of plain words", () => {
    render(<PrivacyPolicyScreen />);

    const hero = within(screen.getByTestId("privacy-policy-hero"));
    expect(hero.getByText("Privacy at SundayBest")).toHaveStyle({
      ...lightTheme.typography.kicker,
      color: lightTheme.colors.accent,
    });
    expect(hero.getByRole("header", { name: "Your study belongs to you." })).toHaveStyle(
      lightTheme.typography.statement,
    );
    expect(
      hero.getByText(
        "SundayBest keeps only what it needs to build your plans and remember your progress.",
      ),
    ).toHaveStyle({ color: lightTheme.colors.text });
  });

  it("puts its three strongest promises first, numbered", () => {
    render(<PrivacyPolicyScreen />);

    const trust = within(screen.getByTestId("privacy-trust"));
    ["No account required", "Reflections stay on your iPhone", "No ads or tracking"].forEach(
      (promise, index) => {
        expect(trust.getByText(promise)).toBeVisible();
        expect(trust.getByText(`0${index + 1}`)).toBeVisible();
      },
    );
  });

  it("gives the short version as four rows, in order", () => {
    render(<PrivacyPolicyScreen />);

    expect(screen.getByRole("header", { name: "The short version" })).toBeVisible();
    expect(
      screen
        .getAllByTestId(/^privacy-short-version-[a-z]+$/)
        .map((row) => String(row.props.testID)),
    ).toEqual(SHORT_VERSION.map(({ topic }) => `privacy-short-version-${topic}`));
    for (const { topic, label } of SHORT_VERSION) {
      expect(screen.getByTestId(`privacy-short-version-${topic}`)).toHaveAccessibleName(label);
    }
  });

  it.each(SHORT_VERSION)("opens $label from its row", ({ topic }) => {
    render(<PrivacyPolicyScreen />);

    fireEvent.press(screen.getByTestId(`privacy-short-version-${topic}`));

    expect(mockPush).toHaveBeenCalledWith(privacyTopicHref(topic));
  });

  it("offers the complete policy, and says when it took effect", () => {
    render(<PrivacyPolicyScreen />);

    expect(screen.getByText("Read the complete privacy policy")).toBeVisible();
    fireEvent.press(screen.getByTestId("privacy-policy-complete"));
    expect(mockPush).toHaveBeenCalledWith(privacyTopicHref("policy"));
    expect(screen.getByText("Effective October 7, 2026 · Privacy version 1.0")).toBeVisible();
  });

  it("goes back to Settings when Back is pressed", () => {
    render(<PrivacyPolicyScreen />);

    fireEvent.press(screen.getByTestId("privacy-policy-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
