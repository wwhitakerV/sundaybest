import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";

const SPARK_COLOR = "#D62626";
const PARTICLE_SIZE = 4;
const PARTICLE_COUNT_MIN = 5;
const PARTICLE_COUNT_MAX = 8;
const DISTANCE_MIN = 10;
const DISTANCE_MAX = 28;
const DURATION_MIN = 180;
const DURATION_MAX = 320;
const SCALE_MIN = 0.7;
const SCALE_MAX = 1.3;
// Sparks bias outward and slightly upward: angles are drawn from the top
// half of the circle (a widened arc centered on "straight up") rather than
// a full 360° spread, which is what keeps the burst from reading as
// symmetric confetti.
const ANGLE_SPREAD_DEGREES = 200;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

type Particle = {
  id: number;
  angleRadians: number;
  distance: number;
  duration: number;
  scale: number;
};

function makeParticles(): Particle[] {
  const count = Math.round(randomBetween(PARTICLE_COUNT_MIN, PARTICLE_COUNT_MAX));

  return Array.from({ length: count }, (_, id) => {
    // 0° is straight up; the spread is centered there so every particle
    // biases upward while still varying left/right and even slightly
    // downward at the arc's extremes.
    const angleDegrees = -90 + randomBetween(-ANGLE_SPREAD_DEGREES / 2, ANGLE_SPREAD_DEGREES / 2);
    return {
      id,
      angleRadians: (angleDegrees * Math.PI) / 180,
      distance: randomBetween(DISTANCE_MIN, DISTANCE_MAX),
      duration: randomBetween(DURATION_MIN, DURATION_MAX),
      scale: randomBetween(SCALE_MIN, SCALE_MAX),
    };
  });
}

function Spark({ particle, testID }: { particle: Particle; testID?: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: particle.duration,
      easing: Easing.out(Easing.quad),
    });
    // Each particle starts its own timing once, on mount — it is never
    // re-triggered, so `particle`/`progress` are deliberately left out of
    // the dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => {
    const travelled = progress.value * particle.distance;
    return {
      opacity: 1 - progress.value,
      transform: [
        { translateX: Math.cos(particle.angleRadians) * travelled },
        { translateY: Math.sin(particle.angleRadians) * travelled },
        { scale: particle.scale * (1 - progress.value * 0.6) },
      ],
    };
  });

  return <Animated.View testID={testID} style={[styles.particle, style]} />;
}

export type SparkBurstProps = {
  /** Flips from false to true to fire a new, independently randomized burst. */
  fire: boolean;
  testID?: string;
};

/**
 * The Daily Study entrance's one-time spark burst: 5–8 small red particles
 * that shoot outward and slightly upward from `StudyNav`, each on its own
 * randomized angle, distance, duration, and scale so the result reads as
 * organic rather than evenly spaced confetti. Renders nothing until
 * `fire` is true, and re-randomizes its particle set each time `fire`
 * flips from false to true.
 */
export function SparkBurst({ fire, testID }: SparkBurstProps) {
  const particles = useMemo(() => (fire ? makeParticles() : []), [fire]);

  if (!fire) return null;

  return (
    <View testID={testID} style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <Spark
          key={particle.id}
          particle={particle}
          {...(testID && { testID: `${testID}-particle-${particle.id}` })}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  particle: {
    position: "absolute",
    width: PARTICLE_SIZE,
    height: PARTICLE_SIZE,
    borderRadius: PARTICLE_SIZE / 2,
    backgroundColor: SPARK_COLOR,
  },
});
