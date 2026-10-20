import { useContext } from "react";
import { StatusBar } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { fireEvent, render, screen } from "@tests/helpers/render";

import { StatusBarFrame } from "@/features/status-bar";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { StatusBarTone } from "@/ui/organisms/status-bar/tone";
import { useScrollToTopTarget } from "@/ui/organisms/status-bar/scroll-to-top";

const mockPower = { level: 82, charging: true, full: false, lowPower: false };
jest.mock("@/core/device/battery", () => ({ usePowerState: () => mockPower }));
jest.mock("@/core/localization/clock", () => ({ usesTwentyFourHourClock: () => false }));

function InsetTop() {
  return <MonoLabel testID="inset-top">{useContext(SafeAreaInsetsContext)?.top}</MonoLabel>;
}

function Page({ onTop }: { onTop: () => void }) {
  useScrollToTopTarget(onTop);
  return <MonoLabel testID="page">Page</MonoLabel>;
}

const withInsets = (top: number, children: React.ReactNode) => (
  <SafeAreaInsetsContext.Provider value={{ top, bottom: 34, left: 0, right: 0 }}>
    {children}
  </SafeAreaInsetsContext.Provider>
);

describe("StatusBarFrame", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-19T13:03:00"), advanceTimers: true });
  });
  afterEach(() => jest.useRealTimers());

  it("shows the page, with our status bar over it", () => {
    render(
      withInsets(
        59,
        <StatusBarFrame>
          <Page onTop={jest.fn()} />
        </StatusBarFrame>,
      ),
    );

    expect(screen.getByTestId("page")).toBeOnTheScreen();
    expect(screen.getByTestId("status-bar")).toHaveAccessibleName(
      "1:03 PM, Battery 82 percent, charging",
    );
  });

  it("keeps iOS's own bar hidden", () => {
    render(
      withInsets(
        59,
        <StatusBarFrame>
          <Page onTop={jest.fn()} />
        </StatusBarFrame>,
      ),
    );

    expect(screen.UNSAFE_getByType(StatusBar).props).toMatchObject({ hidden: true });
  });

  it("leaves a Face ID iPhone's top inset as it is", () => {
    render(
      withInsets(
        59,
        <StatusBarFrame>
          <InsetTop />
        </StatusBarFrame>,
      ),
    );

    expect(screen.getByTestId("inset-top")).toHaveTextContent("59");
  });

  it("keeps a home-button iPhone's 20pt at the top, though its bar is hidden", () => {
    render(
      withInsets(
        0,
        <StatusBarFrame>
          <InsetTop />
        </StatusBarFrame>,
      ),
    );

    expect(screen.getByTestId("inset-top")).toHaveTextContent("20");
  });

  it("turns white when the page asks for it", () => {
    render(
      withInsets(
        59,
        <StatusBarFrame>
          <StatusBarTone light />
        </StatusBarFrame>,
      ),
    );

    expect(
      screen.getByTestId("status-bar-time", { includeHiddenElements: true }),
    ).toBeOnTheScreen();
    expect(screen.getByText("1", { includeHiddenElements: true })).toHaveStyle({
      color: "#FFFFFF",
    });
  });

  it("scrolls the page to its top when the bar is tapped", () => {
    const onTop = jest.fn();
    render(
      withInsets(
        59,
        <StatusBarFrame>
          <Page onTop={onTop} />
        </StatusBarFrame>,
      ),
    );

    fireEvent.press(screen.getByTestId("status-bar"));

    expect(onTop).toHaveBeenCalledTimes(1);
  });
});
