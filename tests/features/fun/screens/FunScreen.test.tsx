import { ScrollView } from "react-native";
import { render, screen, fireEvent, within } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { funDestinationHref } from "@/features/fun/logic/destinations";
import { FunScreen } from "@/features/fun/screens/FunScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();

const GAMES = ["duel", "trivia", "exams", "verse-builder"] as const;

beforeEach(() => {
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

/** The games Play now shows, by test ID, in order. */
function shownGames() {
  return screen
    .queryAllByTestId(/^fun-games-(duel|trivia|exams|verse-builder)$/)
    .map((tile) => String(tile.props.testID));
}

describe("FunScreen", () => {
  it("is addressable as fun-screen", () => {
    render(<FunScreen />);

    expect(screen.getByTestId("fun-screen")).toBeVisible();
  });

  it("shows the title", () => {
    render(<FunScreen />);

    expect(screen.getByText("Fun")).toBeVisible();
  });

  it("shows the account icon", () => {
    render(<FunScreen />);

    expect(screen.getByTestId("fun-account-button")).toBeVisible();
  });

  it("navigates to Settings when the account icon is pressed", () => {
    render(<FunScreen />);

    fireEvent.press(screen.getByTestId("fun-account-button"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings");
  });

  describe("intro", () => {
    it("says what Fun is for, under the title", () => {
      render(<FunScreen />);

      expect(screen.getByText("Play, compete, and master Scripture.")).toBeVisible();
    });

    it("keeps a 16 pt page inset", () => {
      render(<FunScreen />);

      expect(screen.getByTestId("fun-intro")).toHaveStyle({ paddingHorizontal: 16 });
    });
  });

  describe("Quick Play", () => {
    it("features today's game: Heads Up, its running time, and how it's played", () => {
      render(<FunScreen />);
      const hero = within(screen.getByTestId("fun-quick-play"));

      expect(hero.getByText("Quick play today")).toBeVisible();
      expect(hero.getByText("Heads Up:")).toBeVisible();
      expect(hero.getByText("Bible Characters")).toBeVisible();
      expect(hero.getByTestId("fun-quick-play-duration")).toHaveTextContent("60 sec");
      expect(hero.getByText("Guess the person before time runs out.")).toBeVisible();
    });

    it("is a 20 pt-rounded card at least 164 pt tall", () => {
      render(<FunScreen />);

      expect(screen.getByTestId("fun-quick-play")).toHaveStyle({
        borderRadius: 20,
        minHeight: 164,
      });
    });

    it("opens Heads Up from Play now", () => {
      render(<FunScreen />);

      fireEvent.press(screen.getByTestId("fun-quick-play-play"));

      expect(mockPush).toHaveBeenCalledWith(funDestinationHref("heads-up"));
    });

    it("keeps its landscape and cards out of VoiceOver's way", () => {
      render(<FunScreen />);

      for (const art of ["fun-quick-play-landscape", "fun-quick-play-cards"]) {
        expect(screen.getByTestId(art, { includeHiddenElements: true })).toHaveProp(
          "accessibilityElementsHidden",
          true,
        );
      }
    });
  });

  describe("categories", () => {
    it("offers five categories, in order, starting on Quick Play", () => {
      render(<FunScreen />);

      const chips = screen.getAllByTestId(/^fun-categories-option-/);
      expect(chips.map((chip) => String(chip.props.testID))).toEqual(
        ["Quick Play", "Multiplayer", "Trivia", "Exams", "Streaks"].map(
          (label) => `fun-categories-option-${label}`,
        ),
      );
      expect(screen.getByTestId("fun-categories-option-Quick Play")).toBeSelected();
    });

    it("makes each chip 44 pt tall", () => {
      render(<FunScreen />);

      expect(screen.getByTestId("fun-categories-option-Trivia")).toHaveStyle({ height: 44 });
    });

    it("brings Play now up under the chips for a category, and the top back for Quick Play", () => {
      const scrollTo = jest.spyOn(ScrollView.prototype, "scrollTo");
      render(<FunScreen />);
      fireEvent(screen.getByTestId("fun-categories"), "layout", {
        nativeEvent: { layout: { x: 0, y: 212, width: 393, height: 44 } },
      });

      fireEvent.press(screen.getByTestId("fun-categories-option-Exams"));
      expect(scrollTo).toHaveBeenLastCalledWith({ y: 212, animated: false });

      fireEvent.press(screen.getByTestId("fun-categories-option-Quick Play"));
      expect(scrollTo).toHaveBeenLastCalledWith({ y: 0, animated: false });
    });

    it("narrows Play now to the category picked, and back to every game on Quick Play", () => {
      render(<FunScreen />);

      fireEvent.press(screen.getByTestId("fun-categories-option-Multiplayer"));
      expect(screen.getByTestId("fun-categories-option-Multiplayer")).toBeSelected();
      expect(shownGames()).toEqual(["fun-games-duel"]);

      fireEvent.press(screen.getByTestId("fun-categories-option-Quick Play"));
      expect(shownGames()).toEqual(GAMES.map((game) => `fun-games-${game}`));
    });
  });

  describe("Play now", () => {
    it("shows the four games in order, each with its line", () => {
      render(<FunScreen />);

      expect(shownGames()).toEqual(GAMES.map((game) => `fun-games-${game}`));
      expect(screen.getByTestId("fun-games-duel")).toHaveTextContent(
        /1v1 Duel.*Challenge a friend live\./,
      );
      expect(screen.getByTestId("fun-games-trivia")).toHaveTextContent(
        /Daily Trivia.*New questions every day\./,
      );
      expect(screen.getByTestId("fun-games-exams")).toHaveTextContent(
        /Theology Exams.*Beginner to Scholar\./,
      );
      expect(screen.getByTestId("fun-games-verse-builder")).toHaveTextContent(
        /Verse Builder.*Fast memory challenge\./,
      );
    });

    it("shows the live streak on Daily Trivia", () => {
      render(<FunScreen />);

      expect(screen.getByTestId("fun-games-trivia-badge")).toHaveTextContent(/^\d+ day streak$/);
    });

    it("gives each game a 20 pt-rounded card at least 100 pt tall", () => {
      render(<FunScreen />);

      expect(screen.getByTestId("fun-games-duel")).toHaveStyle({
        borderRadius: 20,
        minHeight: 100,
      });
    });

    it.each([
      ["duel", "duel", "1v1 Duel"],
      ["trivia", "daily-trivia", "Daily Trivia"],
      ["exams", "theology-exams", "Theology Exams"],
      ["verse-builder", "verse-builder", "Verse Builder"],
    ] as const)("opens %s at its own destination, and says so", (game, destination, name) => {
      render(<FunScreen />);
      const tile = screen.getByTestId(`fun-games-${game}`);

      expect(tile).toHaveProp("accessibilityHint", `Opens ${name}`);
      fireEvent.press(tile);

      expect(mockPush).toHaveBeenCalledWith(funDestinationHref(destination));
    });

    it("opens every game from See all", () => {
      render(<FunScreen />);

      fireEvent.press(screen.getByTestId("fun-play-now-see-all"));

      expect(mockPush).toHaveBeenCalledWith(funDestinationHref("all-games"));
    });
  });

  describe("Challenge friends", () => {
    it("invites a friendly competition", () => {
      render(<FunScreen />);
      const banner = screen.getByTestId("fun-challenge-friends");

      expect(banner).toHaveTextContent(/Make it a friendly competition\./);
      expect(banner).toHaveTextContent(/Invite friends, track wins, and climb the leaderboard\./);
      expect(banner).toHaveProp("accessibilityHint", "Opens Challenge friends");
    });

    it("keeps its trophy and friends out of VoiceOver's way", () => {
      render(<FunScreen />);

      for (const art of ["fun-challenge-friends-trophy", "fun-challenge-friends-avatars"]) {
        expect(screen.getByTestId(art, { includeHiddenElements: true })).toHaveProp(
          "accessibilityElementsHidden",
          true,
        );
      }
    });

    it("opens the invitation", () => {
      render(<FunScreen />);

      fireEvent.press(screen.getByTestId("fun-challenge-friends"));

      expect(mockPush).toHaveBeenCalledWith(funDestinationHref("challenge-friends"));
    });
  });

  it("has no section from the user's plans", () => {
    render(<FunScreen />);

    expect(screen.queryByText("From your plans")).toBeNull();
    expect(screen.queryByTestId("fun-plan-picks")).toBeNull();
    expect(screen.queryByTestId("fun-categories-option-From Your Plans")).toBeNull();
  });
});
