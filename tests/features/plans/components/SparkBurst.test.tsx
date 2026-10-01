import { render, screen } from "@tests/helpers/render";

import { SparkBurst } from "@/features/plans/components/SparkBurst";
import type * as ThemeBarrel from "@/theme";
import { lightTheme } from "@/theme/tokens";

type ThemeModule = typeof ThemeBarrel;

const mockUseTheme = jest.fn<typeof lightTheme, []>();

jest.mock("@/theme", () => ({
  ...jest.requireActual<ThemeModule>("@/theme"),
  useTheme: () => mockUseTheme(),
}));

beforeEach(() => {
  mockUseTheme.mockReturnValue(lightTheme);
});

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

  it("colours every particle the theme's accent", () => {
    mockUseTheme.mockReturnValue({
      ...lightTheme,
      colors: { ...lightTheme.colors, accent: "#123456" },
    });

    render(<SparkBurst testID="a-spark-burst" fire />);

    const particles = screen.getAllByTestId(/^a-spark-burst-particle-/);
    expect(particles.length).toBeGreaterThan(0);
    for (const particle of particles) {
      expect(particle).toHaveStyle({ backgroundColor: "#123456" });
    }
  });
});
