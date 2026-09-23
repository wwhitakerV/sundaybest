import { render, screen } from "@test/render";

import { SparkBurst } from "./SparkBurst";

describe("SparkBurst", () => {
  it("renders nothing when not fired", () => {
    render(<SparkBurst testID="a-spark-burst" fire={false} />);

    expect(screen.queryByTestId("a-spark-burst")).toBeNull();
  });

  it("renders a handful of particles when fired", () => {
    render(<SparkBurst testID="a-spark-burst" fire />);

    expect(screen.getByTestId("a-spark-burst")).toBeVisible();
    const particleCount = screen.getAllByTestId(/^a-spark-burst-particle-/).length;
    expect(particleCount).toBeGreaterThanOrEqual(5);
    expect(particleCount).toBeLessThanOrEqual(8);
  });

  it("colours every particle the spec red", () => {
    render(<SparkBurst testID="a-spark-burst" fire />);

    const particles = screen.getAllByTestId(/^a-spark-burst-particle-/);
    for (const particle of particles) {
      expect(particle).toHaveStyle({ backgroundColor: "#D62626" });
    }
  });
});
