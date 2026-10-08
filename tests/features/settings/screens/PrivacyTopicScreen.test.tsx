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

describe("PrivacyTopicScreen", () => {
  it.each(["keep", "device", "use", "controls", "policy"])(
    "names the %s page in the bar, and opens on its eyebrow, serif statement, and opening line",
    (id) => {
      open(id);

      expect(within(screen.getByTestId("privacy-topic")).getByText(topic(id).title)).toBeVisible();
      const hero = within(screen.getByTestId("privacy-topic-hero"));
      expect(hero.getByText(topic(id).eyebrow)).toHaveStyle({
        ...lightTheme.typography.kicker,
        color: lightTheme.colors.accent,
      });
      expect(hero.getByRole("header", { name: topic(id).statement })).toHaveStyle(
        lightTheme.typography.statement,
      );
      expect(hero.getByText(topic(id).intro)).toHaveStyle({ color: lightTheme.colors.text });
    },
  );

  it("runs the hero to the very top of the screen, under the status bar and Back", () => {
    open("keep");

    expect(screen.getByTestId("privacy-topic-screen-top-clearance")).toHaveStyle({ height: 0 });
    expect(
      screen.queryByTestId("privacy-topic-screen-header-backdrop", { includeHiddenElements: true }),
    ).toBeNull();
  });

  it("gives the page back its header's backdrop once the hero's scrolled away", () => {
    open("keep");
    fireEvent(screen.getByTestId("privacy-topic-hero"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 300 } },
    });

    fireEvent.scroll(screen.getByTestId("privacy-topic-screen-scroll"), {
      nativeEvent: { contentOffset: { x: 0, y: 400 } },
    });

    expect(
      screen.getByTestId("privacy-topic-screen-header-backdrop", { includeHiddenElements: true }),
    ).toBeOnTheScreen();
  });

  it("features one strong statement, in serif, set apart by a red rule", () => {
    open("keep");

    const quote = screen.getByTestId("privacy-topic-quote");
    expect(quote).toHaveStyle({ borderLeftColor: lightTheme.colors.accent });
    expect(within(quote).getByText(topic("keep").quote ?? "")).toHaveStyle(
      lightTheme.typography.standfirst,
    );
  });

  it("sets out each section under its heading: each item named, then said, in full ink", () => {
    open("keep");

    for (const section of topic("keep").sections) {
      expect(screen.getByRole("header", { name: section.heading })).toHaveStyle(
        lightTheme.typography.sectionTitle,
      );
      const items = section.items ?? [];
      for (const label of items.flatMap((item) => (item.label ? [item.label] : []))) {
        expect(screen.getByText(label)).toBeVisible();
      }
      for (const item of items) {
        expect(screen.getByText(item.text)).toHaveStyle({ color: lightTheme.colors.text });
      }
    }
  });

  it("keeps items to hairlines, never cards", () => {
    open("keep");

    for (const items of screen.getAllByTestId("privacy-items")) {
      expect(items).not.toHaveStyle({ borderWidth: expect.any(Number) as number });
    }
  });

  it("gives a real action a small button that goes there", () => {
    open("controls");

    fireEvent.press(screen.getByText("Open reminder settings"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings/daily-reminder");
  });

  it("reads the complete policy as a document: dated, each section numbered in red above its heading", () => {
    open("policy");

    expect(screen.getByText(topic("policy").effective ?? "")).toBeVisible();
    const [first] = topic("policy").sections;
    expect(screen.getByRole("header", { name: first?.heading ?? "" })).toBeVisible();
    expect(screen.getByText("01")).toHaveStyle({ color: lightTheme.colors.accent });
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
