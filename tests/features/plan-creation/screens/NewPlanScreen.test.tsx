import { render, screen, fireEvent } from "@tests/helpers/render";
import { useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { NewPlanScreen } from "@/features/plan-creation/screens/NewPlanScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockExitModal = jest.fn<void, []>();

beforeEach(() => {
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitModal }),
  });
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

async function goToLinkPreview() {
  fireEvent.press(screen.getByTestId("paste-sermon-continue-button"));
  await screen.findByTestId("link-preview-body");
}

describe("NewPlanScreen", () => {
  it("is addressable as new-plan-screen", () => {
    render(<NewPlanScreen />);

    expect(screen.getByTestId("new-plan-screen")).toBeVisible();
  });

  it("opens on Paste Sermon with its step context", () => {
    render(<NewPlanScreen />);

    expect(screen.getByText("New plan")).toBeVisible();
    expect(screen.getByText("1 of 2")).toBeVisible();
    expect(screen.getByTestId("paste-sermon-body")).toBeVisible();
  });

  it("dismisses the whole modal when Close is pressed", () => {
    render(<NewPlanScreen />);

    fireEvent.press(screen.getByTestId("paste-sermon-close-button"));

    expect(mockExitModal).toHaveBeenCalledTimes(1);
  });

  it("moves to Link Preview in place rather than navigating when Continue is pressed", async () => {
    render(<NewPlanScreen />);

    await goToLinkPreview();

    expect(screen.getByText("2 of 2")).toBeVisible();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("steps back to Paste Sermon when Back is pressed", async () => {
    render(<NewPlanScreen />);
    await goToLinkPreview();

    fireEvent.press(screen.getByTestId("link-preview-back-button"));

    expect(await screen.findByTestId("paste-sermon-body")).toBeVisible();
    expect(mockExitModal).not.toHaveBeenCalled();
  });

  it("navigates to Preparing when Create my plan is pressed", async () => {
    render(<NewPlanScreen />);
    await goToLinkPreview();

    fireEvent.press(screen.getByTestId("link-preview-create-plan-button"));

    expect(mockPush).toHaveBeenCalledWith("/(plan-creation)/preparing");
  });
});
