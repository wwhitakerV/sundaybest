import { AccessibilityInfo } from "react-native";

import { announce } from "@/core/accessibility/announce";

describe("announce", () => {
  it("has VoiceOver say the message", () => {
    const spy = jest.spyOn(AccessibilityInfo, "announceForAccessibility");

    announce("Moved from Acts 17:11. Acts 17:11 is now unanswered.");

    expect(spy).toHaveBeenCalledWith("Moved from Acts 17:11. Acts 17:11 is now unanswered.");
  });

  it("says nothing for an empty message", () => {
    const spy = jest.spyOn(AccessibilityInfo, "announceForAccessibility");

    announce("");

    expect(spy).not.toHaveBeenCalled();
  });
});
