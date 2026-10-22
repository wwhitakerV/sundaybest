import { useMemo, useState } from "react";

import type { DesignRect } from "../logic/lift";

function sameRect(a: DesignRect | undefined, b: DesignRect): boolean {
  return a?.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

/**
 * Where each lift piece sits in its mock, keyed by `getLiftId`, as the
 * pieces' `LiftAnchor`s report it — changing only when a place does.
 */
export function useLiftAnchors() {
  const [anchors, setAnchors] = useState<ReadonlyMap<string, DesignRect>>(() => new Map());
  const onAnchor = useMemo(
    () => (id: string, rect: DesignRect) =>
      setAnchors((previous) =>
        sameRect(previous.get(id), rect) ? previous : new Map(previous).set(id, rect),
      ),
    [],
  );
  return { anchors, onAnchor };
}
