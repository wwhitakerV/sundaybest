import { render, screen, fireEvent } from "@test/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { PrivacyPolicyScreen } from "./PrivacyPolicyScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockBack = jest.fn<void, []>();

beforeEach(() => {
  jest
    .mocked(useRouter)
    .mockReturnValue({ back: mockBack } as unknown as ReturnType<typeof useRouter>);
});

describe("PrivacyPolicyScreen", () => {
  it("is addressable as privacy-policy-screen", () => {
    render(<PrivacyPolicyScreen />);

    expect(screen.getByTestId("privacy-policy-screen")).toBeVisible();
  });

  it("shows the title", () => {
    render(<PrivacyPolicyScreen />);

    expect(screen.getByText("Privacy policy")).toBeVisible();
  });

  it("shows placeholder body text", () => {
    render(<PrivacyPolicyScreen />);

    expect(screen.getByText("...")).toBeVisible();
  });

  it("goes back to Settings when Back is pressed", () => {
    render(<PrivacyPolicyScreen />);

    fireEvent.press(screen.getByTestId("privacy-policy-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
