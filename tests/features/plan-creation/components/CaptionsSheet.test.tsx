import { Modal } from "react-native";
import { render, screen, fireEvent } from "@tests/helpers/render";

import { CaptionsSheet } from "@/features/plan-creation/components/CaptionsSheet";
import { lightTheme } from "@/theme/tokens";

function renderSheet(props: { onTryAnotherLink?: () => void; onRemindLater?: () => void } = {}) {
  return render(
    <CaptionsSheet
      testID="captions"
      visible
      onTryAnotherLink={props.onTryAnotherLink ?? (() => undefined)}
      onRemindLater={props.onRemindLater ?? (() => undefined)}
    />,
  );
}

describe("CaptionsSheet", () => {
  it("says the video has no captions yet", () => {
    renderSheet();

    expect(
      screen.getByRole("header", { name: "This video doesn't have captions yet" }),
    ).toBeOnTheScreen();
  });

  it("slides up itself, rather than letting the Modal fade it in", () => {
    renderSheet();

    expect(screen.UNSAFE_getByType(Modal).props).toHaveProperty("animationType", "none");
  });

  it("draws its grabber in the grabber colour", () => {
    renderSheet();

    expect(screen.getByTestId("captions-grabber", { includeHiddenElements: true })).toHaveStyle({
      backgroundColor: lightTheme.colors.grabber,
    });
  });

  it("tries another link from its first button", () => {
    const onTryAnotherLink = jest.fn();
    renderSheet({ onTryAnotherLink });

    fireEvent.press(screen.getByTestId("captions-try-another-link-button"));

    expect(onTryAnotherLink).toHaveBeenCalledTimes(1);
  });
});
