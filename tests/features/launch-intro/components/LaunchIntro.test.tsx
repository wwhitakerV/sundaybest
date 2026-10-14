import { AccessibilityInfo } from "react-native";
import { render, screen, waitFor } from "@tests/helpers/render";

import { LaunchStage } from "@/features/launch-intro";
import { SFProBody } from "@/ui/typography/SFProBody";
import { lightTheme } from "@/theme/tokens";

function reduceMotion(answer: boolean | "unanswered") {
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockReturnValue(answer === "unanswered" ? new Promise(() => {}) : Promise.resolve(answer));
}

/**
 * The page underneath takes a moment to be ready (the reader, their plans and settings),
 * longer in a busy parallel run: these wait for it, under a test limit that allows for that.
 */
const READY_WAIT_MS = 8000;
const TEST_LIMIT_MS = 15_000;

afterEach(() => {
  jest.restoreAllMocks();
});

/** The launch, over a page standing in for Home or Welcome. */
function launch() {
  render(
    <LaunchStage>
      <SFProBody>The page</SFProBody>
    </LaunchStage>,
  );
}

describe("LaunchStage", () => {
  it("covers the app in white from its first frame, so the page underneath stays hidden", () => {
    reduceMotion("unanswered");

    launch();

    expect(screen.getByTestId("launch-intro-cover")).toHaveStyle({
      backgroundColor: lightTheme.colors.launchPage,
    });
  });

  it("takes every touch while it plays", () => {
    reduceMotion("unanswered");

    launch();

    expect(screen.getByTestId("launch-intro")).not.toHaveProp("pointerEvents", "none");
  });

  it("starts nothing until it knows whether Reduce Motion is on", () => {
    reduceMotion("unanswered");

    launch();

    expect(screen.queryByTestId("launch-intro-canvas")).toBeNull();
    expect(screen.queryByTestId("launch-intro-fade")).toBeNull();
  });

  it("plays the intro on a canvas when motion is fine", async () => {
    reduceMotion(false);

    launch();

    expect(await screen.findByTestId("launch-intro-canvas")).toBeOnTheScreen();
  });

  it("plays the pool intro's movie, as launch-colors names it", async () => {
    reduceMotion(false);

    launch();

    expect(await screen.findByTestId("launch-intro-pool-movie")).toBeOnTheScreen();
  });

  it("keeps the app covered in the page's colour under the intro until the screen is full of water", async () => {
    reduceMotion(false);

    launch();

    expect(await screen.findByTestId("launch-intro-page-colour")).toHaveStyle({
      backgroundColor: lightTheme.colors.launchPage,
      opacity: 1,
    });
  });

  it("keeps the page underneath invisible while the intro covers it, so it can never show early", async () => {
    reduceMotion(false);

    launch();

    expect(await screen.findByTestId("launch-intro-canvas")).toBeOnTheScreen();
    expect(screen.getByTestId("launch-stage-page")).toHaveStyle({ opacity: 0 });
  });

  it(
    "shows the page as the Reduce Motion fade begins",
    async () => {
      reduceMotion(true);

      launch();

      await waitFor(() => expect(screen.getByText("The page")).toBeVisible(), {
        timeout: READY_WAIT_MS,
      });
    },
    TEST_LIMIT_MS,
  );

  it(
    "with Reduce Motion on, plays nothing: it fades away to the page once that's ready",
    async () => {
      reduceMotion(true);

      launch();

      // The page underneath takes a moment to be ready: the reader, their plans and settings.
      await waitFor(() => expect(screen.queryByTestId("launch-intro")).toBeNull(), {
        timeout: READY_WAIT_MS,
      });
      expect(screen.queryByTestId("launch-intro-canvas")).toBeNull();
    },
    TEST_LIMIT_MS,
  );
});
