import { Component, type ReactNode } from "react";

type IntroFailSafeProps = { children: ReactNode; onFail: () => void };

/**
 * If the intro ever fails to draw, it steps aside instead of taking the app
 * down with it: the page is shown, and the app carries on without an intro.
 */
export class IntroFailSafe extends Component<IntroFailSafeProps, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(): void {
    this.props.onFail();
  }

  override render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}
