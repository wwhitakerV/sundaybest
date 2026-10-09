import { ABOUT_CARD, ABOUT_READING, ABOUT_TITLE, boldOnPage } from "@tests/helpers/type-on-page";
import { render, screen, fireEvent, within } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { PRIVACY_TOPICS } from "@/features/settings/logic/privacy-topics";
import { PrivacyTopicScreen } from "@/features/settings/screens/PrivacyTopicScreen";
import { lightTheme } from "@/theme/tokens";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
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

function open(topic: string) {
  jest.mocked(useLocalSearchParams).mockReturnValue({ topic });
  render(<PrivacyTopicScreen />);
}

const topic = (id: string) => {
  const found = PRIVACY_TOPICS.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`no ${id}`);
  return found;
};

const IDS = ["keep", "device", "use", "controls", "policy"];

describe("PrivacyTopicScreen", () => {
  it.each(IDS)("names the %s page in the bar, then opens on its title and opening line", (id) => {
    open(id);

    expect(within(screen.getByTestId("privacy-topic")).getByText(topic(id).title)).toBeVisible();
    expect(screen.getByRole("header", { name: topic(id).statement })).toHaveStyle(ABOUT_TITLE);
    expect(screen.getByText(topic(id).intro)).toHaveStyle(ABOUT_READING);
    expect(screen.queryByTestId("privacy-topic-hero")).toBeNull();
  });

  it("features its strong statement in serif, on a soft card, as Scripture is", () => {
    open("keep");

    const quote = screen.getByTestId("privacy-topic-quote");
    expect(quote).toHaveStyle(ABOUT_CARD);
    expect(within(quote).getByText(topic("keep").quote ?? "")).toHaveStyle(
      lightTheme.typography.standfirst,
    );
  });

  it("heads each section as the Study heads a paragraph, its items on a card: named lightly, then said with room", () => {
    open("keep");

    for (const [index, section] of topic("keep").sections.entries()) {
      expect(screen.getByRole("header", { name: section.heading })).toHaveStyle(
        lightTheme.typography.stepTitle,
      );
      expect(screen.getByTestId(`privacy-topic-section-${index}-items`)).toHaveStyle(ABOUT_CARD);
      for (const item of section.items ?? []) {
        expect(screen.getByText(item.label ?? "")).toHaveStyle(lightTheme.typography.body);
        expect(screen.getByText(item.text)).toHaveStyle({
          ...lightTheme.typography.rowDetail,
          color: lightTheme.colors.textSupporting,
        });
      }
    }
  });

  it("sets a section's paragraphs in the Study's reading type", () => {
    open("use");

    const [paragraph] = topic("use").sections[1]?.paragraphs ?? [];
    expect(screen.getByText(paragraph ?? "")).toHaveStyle(ABOUT_READING);
  });

  it("goes to a setting it talks about from a row, as Settings does", () => {
    open("controls");

    fireEvent.press(screen.getByRole("button", { name: "Daily reminder" }));
    expect(mockPush).toHaveBeenLastCalledWith("/(tabs)/settings/daily-reminder");
    fireEvent.press(screen.getByRole("button", { name: "Bible translation" }));
    expect(mockPush).toHaveBeenLastCalledWith("/(tabs)/settings/bible-translation");
  });

  it("dates the complete policy, and numbers its sections", () => {
    open("policy");

    expect(screen.getByText(topic("policy").effective ?? "")).toBeVisible();
    const [first] = topic("policy").sections;
    expect(screen.getByRole("header", { name: `1. ${first?.heading ?? ""}` })).toBeVisible();
  });

  it("sets a policy's plain statements in full ink, on a card", () => {
    open("policy");

    const [statement] = topic("policy").sections[1]?.items ?? [];
    expect(screen.getByText(statement?.text ?? "")).toHaveStyle({
      ...lightTheme.typography.body,
      color: lightTheme.colors.text,
    });
  });

  it.each(IDS)("sets nothing on the %s page in bold", (id) => {
    open(id);

    expect(boldOnPage("privacy-topic")).toEqual([]);
  });

  it("says so for a page there isn't, with the way back", () => {
    open("sermons");

    expect(screen.queryByTestId("privacy-topic-screen")).toBeNull();
    fireEvent.press(screen.getByTestId("privacy-topic-not-found-action"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("goes back to Privacy policy when Back is pressed", () => {
    open("use");

    fireEvent.press(screen.getByTestId("privacy-topic-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
