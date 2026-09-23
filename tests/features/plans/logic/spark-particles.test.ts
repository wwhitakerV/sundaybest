import { makeSparkParticles, type RandomSource } from "@/features/plans/logic/spark-particles";

/** A deterministic stand-in for Math.random: cycles through the given values. */
function sequence(...values: number[]): RandomSource {
  let index = 0;
  return () => {
    const value = values[index % values.length] ?? 0;
    index += 1;
    return value;
  };
}

describe("makeSparkParticles", () => {
  it("makes 7 or 8 particles with unique ids", () => {
    const low = makeSparkParticles(400, 800, sequence(0));
    const high = makeSparkParticles(400, 800, sequence(0.99));

    expect(low).toHaveLength(7);
    expect(high).toHaveLength(8);
    expect(new Set(high.map((particle) => particle.id)).size).toBe(8);
  });

  it("always travels upward", () => {
    for (const particle of makeSparkParticles(400, 800, sequence(0.1, 0.9, 0.5, 0.3))) {
      expect(particle.endY).toBeLessThan(0);
    }
  });

  it("travels away from the side it started on", () => {
    const [left] = makeSparkParticles(400, 800, sequence(0));
    const [right] = makeSparkParticles(400, 800, sequence(0.99));

    expect(left?.endX).toBeLessThan(0);
    expect(right?.endX).toBeGreaterThan(0);
  });

  it("keeps duration and scale inside their ranges", () => {
    for (const particle of makeSparkParticles(400, 800, sequence(0, 0.99))) {
      expect(particle.duration).toBeGreaterThanOrEqual(280);
      expect(particle.duration).toBeLessThanOrEqual(520);
      expect(particle.scale).toBeGreaterThanOrEqual(0.8);
      expect(particle.scale).toBeLessThanOrEqual(1.35);
    }
  });

  it("is deterministic for the same random source", () => {
    expect(makeSparkParticles(400, 800, sequence(0.2, 0.7))).toEqual(
      makeSparkParticles(400, 800, sequence(0.2, 0.7)),
    );
  });
});
