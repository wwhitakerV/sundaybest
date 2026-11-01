import { lightTheme, type Theme } from "./tokens";

/**
 * Formation vIdeal's paper and the materials drawn on it, each sampled from
 * its reference: a warm off-white page, cream ceramic, glossy red, a pale
 * stone, graphite pencil, and the warm browns its shadows fall in. Light only:
 * the app has no dark mode.
 */
export const FORMATION_PAPER = {
  /** The page, where the light falls on it: also the tab bar's, while vIdeal is shown. */
  page: "#E9E5DF",
  /** The active tab's pill on that page: a warm step darker, as `paperShade` is on white. */
  pageShade: "#DCD6CD",
  /** Pencil: a warm graphite, laid down faint. */
  graphite: "#6F6252",
  /** The fine red threads joining one object to the next. */
  connector: "#C8231D",
  /**
   * Shadows, multiplied into whatever's under them, as a real shadow darkens
   * the page: measured off the reference as how much of each of red, green
   * and blue they let through, so a cream object's is a warm brown (55 / 49
   * / 42% at its core), the stone's a touch paler (60 / 54 / 47%), and a red
   * object's a red-brown (65 / 46 / 37%), the red it lets through warming it.
   */
  shadow: "#2E1200",
  shadowStone: "#452A0A",
  shadowRed: "#5A0000",
} as const;

/**
 * A material's tones, lit to unlit: where the light strikes, its own colour,
 * turning away, and in its own shadow — and the bright edge it shows where
 * its rim turns toward the light (`rim`). Sampled from the reference: matte,
 * soft-touch surfaces under one large soft light, never a hot spot.
 */
export type FormationMaterial = {
  light: string;
  body: string;
  shade: string;
  deep: string;
  rim: string;
};

export const FORMATION_MATERIALS = {
  ceramic: { light: "#F8F4ED", body: "#F8F5F1", shade: "#CDBEA8", deep: "#8E7A60", rim: "#FDFBF7" },
  red: { light: "#E5382A", body: "#DA2620", shade: "#B40103", deep: "#7C0102", rim: "#FD603B" },
  stone: { light: "#EEE8DE", body: "#EFE9DF", shade: "#B8AB99", deep: "#7A6449", rim: "#F9F6F1" },
} as const satisfies Record<string, FormationMaterial>;

/** What's set into a face: a red recess's floor, its check's white, and the pearl in the red eye. */
export const FORMATION_INLAY = {
  recess: "#6B0101",
  check: "#F4EEE8",
  pearl: "#F0C8B8",
  ceramicInk: "#6C5945",
  /**
   * The mouth's plaque: a warm satin cream a little darker than its dome's
   * white, as the reference's is (its face about nine-tenths of the lit
   * dome's brightness, and warmer), so its sheen and rim show on it.
   */
  plaque: "#E6DACA",
  /** The linen's threads on a face that mustn't warm (the eye's): a neutral grey, as dark as the ceramic's deep. */
  linenNeutral: "#7E7E7D",
  /**
   * A stone's patches of tone, measured off its reference — cream where it's
   * chalky or worn clean, putty, and a dusky grey-brown — then each taken a
   * third of the way to white and cooled, as its body is, so it sits with
   * the ceramics.
   */
  stoneCream: "#F5F1EA",
  stonePutty: "#E0D7CC",
  stoneDusk: "#CBC1B6",
  /** The grime a stone gathers in its creases, seams, chips and round its edge: a warm taupe-brown. */
  stoneGrime: "#6A523A",
  /** The orange-red flecks in a stone. */
  stoneFleck: "#E0452A",
  /** The near-black grime in a red ball's cracks, chips and pocks. */
  redGrime: "#2A0806",
} as const;

/** The light theme, laid on Formation's paper: the page and everything set on it — the tab bar too. */
export const formationPaperTheme: Theme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background: FORMATION_PAPER.page,
    tabActiveBackground: FORMATION_PAPER.pageShade,
  },
};
