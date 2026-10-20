import { Pressable } from "react-native";
import { fireEvent, render, screen } from "@tests/helpers/render";

import {
  ScrollToTopProvider,
  useScrollToTop,
  useScrollToTopTarget,
} from "@/ui/organisms/status-bar/scroll-to-top";

function Bar() {
  return <Pressable testID="bar" onPress={useScrollToTop()} />;
}

function Page({ onTop }: { onTop: () => void }) {
  useScrollToTopTarget(onTop);
  return null;
}

describe("scrolling to the top from the status bar", () => {
  it("scrolls the page's scroller up", () => {
    const onTop = jest.fn();
    render(
      <ScrollToTopProvider>
        <Page onTop={onTop} />
        <Bar />
      </ScrollToTopProvider>,
    );

    fireEvent.press(screen.getByTestId("bar"));

    expect(onTop).toHaveBeenCalledTimes(1);
  });

  it("scrolls only the page opened last", () => {
    const under = jest.fn();
    const over = jest.fn();
    render(
      <ScrollToTopProvider>
        <Page onTop={under} />
        <Page onTop={over} />
        <Bar />
      </ScrollToTopProvider>,
    );

    fireEvent.press(screen.getByTestId("bar"));

    expect(over).toHaveBeenCalledTimes(1);
    expect(under).not.toHaveBeenCalled();
  });

  it("does nothing with no page to scroll", () => {
    render(
      <ScrollToTopProvider>
        <Bar />
      </ScrollToTopProvider>,
    );

    expect(() => fireEvent.press(screen.getByTestId("bar"))).not.toThrow();
  });
});
