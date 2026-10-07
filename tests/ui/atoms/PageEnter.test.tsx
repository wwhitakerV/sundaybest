import { Text } from "react-native";
import { render, screen } from "@tests/helpers/render";

import { motion } from "@/theme";
import { PageEnter, getPageEnterAnimation } from "@/ui/atoms/PageEnter";

type Frame = { opacity?: number; transform?: Record<string, number>[] };

function frames(order: number, still = false) {
  const animation = getPageEnterAnimation(order, still);
  const name = animation.animationName as unknown as Record<"from" | "to", Frame>;
  return { animation, from: name.from, to: name.to };
}

describe("getPageEnterAnimation", () => {
  it("fades a part in as it moves left into place", () => {
    const { from, to } = frames(0);

    expect(from).toEqual({ opacity: 0, transform: [{ translateX: motion.pageEnter.fromX }] });
    expect(to).toEqual({ opacity: 1, transform: [{ translateX: 0 }] });
    expect(motion.pageEnter.fromX).toBeGreaterThan(0);
  });

  it("never moves a part up or down", () => {
    const { from, to } = frames(2);

    expect(JSON.stringify([from, to])).not.toMatch(/translateY/);
  });

  it("brings each part in a beat behind the one before", () => {
    expect(frames(1).animation.animationDelay).toBe(motion.pageEnter.staggerMs);
    expect(frames(2).animation.animationDelay).toBe(motion.pageEnter.staggerMs * 2);
  });

  it("holds a part unseen through its delay, so it never shows before it starts", () => {
    expect(frames(2).animation.animationFillMode).toBe("backwards");
  });

  it("only fades, without moving, with motion reduced", () => {
    const { from, to } = frames(0, true);

    expect(from).toEqual({ opacity: 0 });
    expect(to).toEqual({ opacity: 1 });
  });
});

describe("PageEnter", () => {
  it("shows what it holds", () => {
    render(
      <PageEnter testID="part" order={0}>
        <Text>Day 2 Read</Text>
      </PageEnter>,
    );

    expect(screen.getByText("Day 2 Read")).toBeVisible();
  });

  it("plays its entrance as it mounts — nothing to trigger, nothing to miss", () => {
    render(
      <PageEnter testID="part" order={1}>
        <Text>Day 2 Read</Text>
      </PageEnter>,
    );

    expect(screen.getByTestId("part")).toHaveStyle({
      animationDuration: motion.pageEnter.durationMs,
      animationDelay: motion.pageEnter.staggerMs,
    });
  });
});
