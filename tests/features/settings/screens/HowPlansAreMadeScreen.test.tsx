import { ABOUT_CARD, ABOUT_READING, ABOUT_TITLE, boldOnPage } from "@tests/helpers/type-on-page";
import { render, screen, fireEvent, within } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { HOW_PLANS_ARE_MADE } from "@/features/settings/logic/how-plans-are-made";
import { HowPlansAreMadeScreen } from "@/features/settings/screens/HowPlansAreMadeScreen";
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

describe("HowPlansAreMadeScreen", () => {
  it("is named in the bar beside Back, then opens on its title and a line to read", () => {
    render(<HowPlansAreMadeScreen />);

    expect(
      within(screen.getByTestId("how-plans-are-made")).getByText("How plans are made"),
    ).toBeVisible();
    expect(screen.getByRole("header", { name: HOW_PLANS_ARE_MADE.statement })).toHaveStyle(
      ABOUT_TITLE,
    );
    expect(screen.getByText(HOW_PLANS_ARE_MADE.intro)).toHaveStyle(ABOUT_READING);
    expect(screen.queryByTestId("how-plans-are-made-hero")).toBeNull();
  });

  it("walks the five steps in order, on a card, each named then said", () => {
    render(<HowPlansAreMadeScreen />);

    const steps = screen.getByTestId("how-plans-are-made-steps");
    expect(steps).toHaveStyle(ABOUT_CARD);
    const labels = within(steps)
      .getAllByText(/./)
      .map((node) => node.props.children as string);
    const headings: string[] = HOW_PLANS_ARE_MADE.steps.map(({ heading }) => heading);
    expect(labels.filter((label) => headings.includes(label))).toEqual(headings);
    for (const step of HOW_PLANS_ARE_MADE.steps) {
      expect(within(steps).getByText(step.heading)).toHaveStyle(lightTheme.typography.body);
      expect(within(steps).getByText(step.text)).toHaveStyle(lightTheme.typography.rowDetail);
    }
  });

  it("features its statement on Scripture in serif, on a soft card, as Scripture is", () => {
    render(<HowPlansAreMadeScreen />);

    const quote = screen.getByTestId("how-plans-are-made-quote");
    expect(quote).toHaveStyle(ABOUT_CARD);
    expect(within(quote).getByText(HOW_PLANS_ARE_MADE.quote)).toHaveStyle(
      lightTheme.typography.standfirst,
    );
  });

  it("sets out what stays true under the Study's heading, on a card", () => {
    render(<HowPlansAreMadeScreen />);

    expect(screen.getByRole("header", { name: HOW_PLANS_ARE_MADE.truths.heading })).toHaveStyle(
      lightTheme.typography.stepTitle,
    );
    for (const item of HOW_PLANS_ARE_MADE.truths.items ?? []) {
      expect(screen.getByText(item.label ?? "")).toBeVisible();
    }
  });

  it("goes on to how SundayBest handles your data, from a row", () => {
    render(<HowPlansAreMadeScreen />);

    fireEvent.press(screen.getByRole("button", { name: HOW_PLANS_ARE_MADE.privacyLink }));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings/privacy-policy");
  });

  it("sets nothing in bold", () => {
    render(<HowPlansAreMadeScreen />);

    expect(boldOnPage("how-plans-are-made")).toEqual([]);
  });

  it("goes back when Back is pressed", () => {
    render(<HowPlansAreMadeScreen />);

    fireEvent.press(screen.getByTestId("how-plans-are-made-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
