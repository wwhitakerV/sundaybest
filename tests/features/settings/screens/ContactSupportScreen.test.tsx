import { ABOUT_READING, ABOUT_TITLE, boldOnPage } from "@tests/helpers/type-on-page";
import { render, screen, fireEvent, within } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { ContactSupportScreen } from "@/features/settings/screens/ContactSupportScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockBack = jest.fn<void, []>();

beforeEach(() => {
  mockBack.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ back: mockBack } as unknown as ReturnType<typeof useRouter>);
});

describe("ContactSupportScreen", () => {
  it("is named in the bar beside Back, then opens on its title and a line to read", () => {
    render(<ContactSupportScreen />);

    expect(
      within(screen.getByTestId("contact-support")).getByText("Contact support"),
    ).toBeVisible();
    expect(screen.getByRole("header", { name: "How can we help?" })).toHaveStyle(ABOUT_TITLE);
    expect(screen.getByText("Ask a question, report a bug, or share an idea.")).toHaveStyle(
      ABOUT_READING,
    );
    expect(screen.queryByTestId("contact-support-hero")).toBeNull();
  });

  it("asks what it's about as a row of the app's chips, a question to start", () => {
    render(<ContactSupportScreen />);

    expect(screen.getByTestId("contact-support-topic-question")).toBeSelected();
    fireEvent.press(screen.getByTestId("contact-support-topic-bug"));

    expect(screen.getByTestId("contact-support-topic-bug")).toBeSelected();
    expect(screen.getByTestId("contact-support-topic-question")).not.toBeSelected();
  });

  it("asks for the message in the words of what it's about", () => {
    render(<ContactSupportScreen />);

    expect(screen.getByLabelText("Message")).toHaveProp("placeholder", "What's your question?");
    fireEvent.press(screen.getByTestId("contact-support-topic-bug"));
    expect(screen.getByLabelText("Message")).toHaveProp("placeholder", "What happened?");
    fireEvent.press(screen.getByTestId("contact-support-topic-idea"));
    expect(screen.getByLabelText("Message")).toHaveProp("placeholder", "What's your idea?");
  });

  it("takes a name, an email, and a message", () => {
    render(<ContactSupportScreen />);

    expect(screen.getByLabelText("Name")).toHaveProp("placeholder", "Name (optional)");
    expect(screen.getByLabelText("Email")).toHaveProp("keyboardType", "email-address");
    expect(screen.getByLabelText("Message")).toHaveProp("multiline", true);
  });

  it("holds Send until there's an email and a message", () => {
    render(<ContactSupportScreen />);

    expect(screen.getByTestId("contact-support-send")).toBeDisabled();
    fireEvent.changeText(screen.getByLabelText("Email"), "reader@example.com");
    expect(screen.getByTestId("contact-support-send")).toBeDisabled();
    fireEvent.changeText(screen.getByLabelText("Message"), "The reminder didn't ring.");

    expect(screen.getByTestId("contact-support-send")).toBeEnabled();
  });

  it("says what's sent along, and what never to send, in one line at its foot", () => {
    render(<ContactSupportScreen />);

    expect(
      within(screen.getByTestId("contact-support-footnote")).getByText(
        /is included so we can help faster\. Never send passwords or payment details\./,
      ),
    ).toHaveStyle({ textAlign: "center" });
  });

  it("sets nothing in bold", () => {
    render(<ContactSupportScreen />);

    expect(boldOnPage("contact-support")).toEqual([]);
  });

  it("goes back when Back is pressed", () => {
    render(<ContactSupportScreen />);

    fireEvent.press(screen.getByTestId("contact-support-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
