/**
 * The water intro's glass: every colour its water is made of, from the v4
 * prototype (`docs/prototypes/launch-intro-pool-v4.html`). Clear water drawn
 * opaque — no pixel of it is see-through — its look made only from these
 * solid colours: a near-white body, shading where it thins and bends the light
 * away, highlights where light catches it, and the spectrum glass splits light
 * into at its edges. The launch never shows in dark mode, so there is one set.
 */
export const LAUNCH_WATER = {
  /** The body: clear and colourless — the pool's, and the drips' and letters'. */
  poolBody: "#F2F2F1",
  dropBody: "#F0F2F3",
  /** Deeper toward its lower side, where it bends the light away. */
  shade: "#CBD0D3",
  /** The rim, darker where the water is thin. */
  rim: "#959CA1",
  /** A soft sheen inside the edge. */
  sheen: "#FDFEFE",
  /** A faint glow where the light gathers, on its lower side. */
  glow: "#FAFBFC",
  /** Highlights, catchlights, caustic light and glints. */
  light: "#FFFFFF",
  /** The spectrum at its edges, as iOS's glass splits light: toward the light, then away. */
  violet: "#9C8CF0",
  blue: "#3E8BF0",
  cyan: "#4FD0F2",
  green: "#B4E86E",
  pink: "#F07AB4",
  amber: "#F6AE45",
  /** The same, fainter, further in, where light bends back through the body. */
  innerCyan: "#6FD6F5",
  innerRose: "#F59AC6",
  /** Bands of bent light inside the pool's body, as in thick glass: fine ones close in… */
  finePeach: "#F5D8C4",
  fineAqua: "#D2EEE8",
  /** …broad ones deeper, and a deeper band where the water is thickest. */
  peach: "#F5DCCB",
  lilac: "#E1D8F3",
  aqua: "#D4EFEA",
  thick: "#E0E2E4",
  /** Inside a written letter: a cooler, deeper tone for its light to show against… */
  letterDeep: "#D9E0E5",
  /** …and richer bands than the pool's, so they read in strokes this small. */
  letterPeach: "#F2C9AE",
  letterLilac: "#D3C4F0",
  letterAqua: "#BDE8DE",
  /** Soft patches of refracted colour drifting in its body: warm, lilac, aqua, pale gold. */
  patches: ["#F7E3D3", "#E8E0F5", "#D9F1EC", "#FCF4DE"],
} as const;
