import { render, screen, fireEvent } from "@tests/helpers/render";
import * as Clipboard from "expo-clipboard";
import { useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { NewPlanScreen } from "@/features/plan-creation/screens/NewPlanScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
  useIsFocused: () => true,
}));

jest.mock("expo-clipboard", () => ({ getStringAsync: jest.fn() }));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockExitModal = jest.fn<void, []>();
const LINK = "https://youtube.com/watch?v=Qm81xRz4";

beforeEach(() => {
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitModal }),
  });
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

async function goToLinkPreview(link = LINK) {
  fireEvent.changeText(screen.getByTestId("paste-sermon-link-input"), link);
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

  it("keeps Continue off until there's a link", () => {
    render(<NewPlanScreen />);

    expect(screen.getByTestId("paste-sermon-continue-button")).toBeDisabled();
  });

  it("fills the link from the clipboard when Paste is pressed", async () => {
    jest.mocked(Clipboard.getStringAsync).mockResolvedValue(LINK);
    render(<NewPlanScreen />);

    fireEvent.press(screen.getByTestId("paste-sermon-link-input-paste-button"));

    expect(await screen.findByDisplayValue(LINK)).toBeVisible();
    expect(screen.getByTestId("paste-sermon-continue-button")).toBeEnabled();
  });

  it("says so when the link isn't a link, and stays put", () => {
    render(<NewPlanScreen />);

    fireEvent.changeText(screen.getByTestId("paste-sermon-link-input"), "last sunday");
    fireEvent.press(screen.getByTestId("paste-sermon-continue-button"));

    expect(screen.getByTestId("paste-sermon-link-input-error")).toBeVisible();
    expect(screen.getByTestId("paste-sermon-body")).toBeVisible();
  });

  it("dismisses the whole modal when Close is pressed", () => {
    render(<NewPlanScreen />);

    fireEvent.press(screen.getByTestId("paste-sermon-close-button"));

    expect(mockExitModal).toHaveBeenCalledTimes(1);
  });

  it("shows the link's sermon on Link Preview, in place rather than navigating", async () => {
    render(<NewPlanScreen />);

    await goToLinkPreview();

    expect(screen.getByText("2 of 2")).toBeVisible();
    expect(screen.getByText("Choose Whom You Will Serve")).toBeVisible();
    expect(screen.getByText("…/watch?v=Qm81xRz4")).toBeVisible();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("says when a plan of the chosen length would end", async () => {
    render(<NewPlanScreen />);
    await goToLinkPreview();

    fireEvent.press(screen.getByTestId("link-preview-days-3"));

    expect(screen.getByText("Ends Wednesday.")).toBeVisible();
    expect(screen.getByTestId("link-preview-days-3")).toBeSelected();
  });

  it("steps back to Paste Sermon when Back is pressed", async () => {
    render(<NewPlanScreen />);
    await goToLinkPreview();

    fireEvent.press(screen.getByTestId("link-preview-back-button"));

    expect(await screen.findByTestId("paste-sermon-body")).toBeVisible();
    expect(mockExitModal).not.toHaveBeenCalled();
  });

  it("creates the plan and moves on to Preparing when Create my plan is pressed", async () => {
    render(<NewPlanScreen />);
    await goToLinkPreview();

    fireEvent.press(screen.getByTestId("link-preview-create-plan-button"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(plan-creation)/preparing",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.any()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
      params: { planId: expect.any(String) },
    });
  });
});
