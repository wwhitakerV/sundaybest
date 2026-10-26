import { useEffect, useState } from "react";
import { PixelRatio } from "react-native";
import { drawAsImage, Group } from "@shopify/react-native-skia";

import type { ObjectMaps } from "../components/LitObject";
import { ObjectAlbedo } from "../components/ObjectAlbedo";
import { ObjectHeight } from "../components/ObjectHeight";
import type { IdealObject } from "../logic/formation-ideal";

/** The square an object's maps cover, of its diameter: room for its heart's lobes and soft edges. */
export const MAP_BOX = 1.15;

/** Maps already made, by object and size: each is made once. */
const made = new Map<string, ObjectMaps>();

/**
 * An object's height and colour maps for the surface shader, made once for
 * its size at the screen's own resolution and kept: none until they're made
 * (a moment, on first open).
 */
export function useObjectMaps(object: IdealObject, r: number): ObjectMaps | null {
  const scale = PixelRatio.get();
  const key = `${object.id}:${Math.round(r * scale)}`;
  const [maps, setMaps] = useState<ObjectMaps | null>(() => made.get(key) ?? null);

  useEffect(() => {
    if (made.has(key)) return;
    let current = true;
    const centre = r * MAP_BOX;
    const side = Math.ceil(centre * 2 * scale);
    const size = { width: side, height: side };
    const draw = (map: "height" | "albedo") => (
      <Group transform={[{ scale }]}>
        {map === "height" ? (
          <ObjectHeight object={object} centre={centre} r={r} />
        ) : (
          <ObjectAlbedo object={object} centre={centre} r={r} />
        )}
      </Group>
    );
    void Promise.all([drawAsImage(draw("height"), size), drawAsImage(draw("albedo"), size)]).then(
      ([height, albedo]) => {
        if (!height || !albedo) return;
        made.set(key, { height, albedo });
        if (current) setMaps({ height, albedo });
      },
    );
    return () => {
      current = false;
    };
  }, [key, object, r, scale]);

  return maps ?? made.get(key) ?? null;
}
