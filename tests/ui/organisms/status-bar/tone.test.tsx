import { useState } from "react";
import { Pressable } from "react-native";
import { fireEvent, render, screen } from "@tests/helpers/render";

import { MonoLabel } from "@/ui/typography/MonoLabel";
import {
  StatusBarTone,
  StatusBarToneProvider,
  useStatusBarTone,
} from "@/ui/organisms/status-bar/tone";

function ShowTone() {
  return <MonoLabel testID="tone">{useStatusBarTone()}</MonoLabel>;
}

function Page({ first, second }: { first: boolean; second: boolean }) {
  const [shown, setShown] = useState(true);
  return (
    <StatusBarToneProvider>
      <StatusBarTone light={first} />
      {shown && <StatusBarTone light={second} />}
      <Pressable testID="leave" onPress={() => setShown(false)} />
      <ShowTone />
    </StatusBarToneProvider>
  );
}

describe("the status bar's tone", () => {
  it("is dark on the page until something asks for light", () => {
    render(
      <StatusBarToneProvider>
        <ShowTone />
      </StatusBarToneProvider>,
    );

    expect(screen.getByTestId("tone")).toHaveTextContent("dark");
  });

  it("is light while something over a dark hero asks for it", () => {
    render(
      <StatusBarToneProvider>
        <StatusBarTone light />
        <ShowTone />
      </StatusBarToneProvider>,
    );

    expect(screen.getByTestId("tone")).toHaveTextContent("light");
  });

  it("takes what was asked last, as iOS's StatusBar stack does", () => {
    render(<Page first second={false} />);

    expect(screen.getByTestId("tone")).toHaveTextContent("dark");
  });

  it("goes back to what was asked before once the last asker leaves", () => {
    render(<Page first second={false} />);

    fireEvent.press(screen.getByTestId("leave"));

    expect(screen.getByTestId("tone")).toHaveTextContent("light");
  });
});
