import { useEffect, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { makeSparkParticles, type SparkParticle } from "../logic/spark-particles";

const SPARK_COLOR = "#D62626";
const PARTICLE_WIDTH = 3;
const PARTICLE_HEIGHT = 9;

function Spark({ particle, testID }: { particle: SparkParticle; testID?: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: particle.duration,
      // Fast launch, then a natural deceleration toward the unique endpoint.
      easing: Easing.out(Easing.quad),
    });
    // A Spark is mounted once for a single burst, so this animation should
    // not restart because an object reference changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    // Fully visible through most of its flight so it can be seen crossing
    // the screen, then a rapid fade near the end.
    const fadeStart = 0.72;
    const opacity =
      progress.value < fadeStart
        ? 1
        : Math.max(0, 1 - (progress.value - fadeStart) / (1 - fadeStart));

    return {
      opacity,
      transform: [
        { translateX: particle.endX * progress.value },
        { translateY: particle.endY * progress.value },
        { rotate: `${particle.rotationDeg}deg` },
        { scale: particle.scale * (1 - progress.value * 0.35) },
      ],
    };
  });

  return (
    <Animated.View
      testID={testID}
      style={[
        styles.particle,
        {
          left: `${particle.originXPercent}%`,
          top: `${particle.originYPercent}%`,
        },
        animatedStyle,
      ]}
    />
  );
}

export type SparkBurstProps = {
  /** True only while the one-shot StudyNav burst should exist. */
  fire: boolean;
  testID?: string;
};

/** StudyNav's one-shot, screen-crossing spark burst (see `makeSparkParticles`). */
export function SparkBurst({ fire, testID }: SparkBurstProps) {
  const { width, height } = useWindowDimensions();
  const particles = useMemo(
    () => (fire ? makeSparkParticles(width, height) : []),
    [fire, height, width],
  );

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
    overflow: "visible",
    zIndex: 100,
  },
  particle: {
    position: "absolute",
    width: PARTICLE_WIDTH,
    height: PARTICLE_HEIGHT,
    marginLeft: -PARTICLE_WIDTH / 2,
    marginTop: -PARTICLE_HEIGHT / 2,
    borderRadius: PARTICLE_WIDTH / 2,
    backgroundColor: SPARK_COLOR,
  },
});
