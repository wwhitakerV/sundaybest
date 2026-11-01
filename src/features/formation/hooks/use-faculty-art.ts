import { useImage, type SkImage } from "@shopify/react-native-skia";

import { FACULTY_ART } from "../components/faculty-art";

/** The six faculties' artworks, decoded once for the board, by object id; each null until it's ready. */
export function useFacultyArt(): Readonly<Record<keyof typeof FACULTY_ART, SkImage | null>> {
  return {
    eye: useImage(FACULTY_ART.eye),
    ear: useImage(FACULTY_ART.ear),
    brain: useImage(FACULTY_ART.brain),
    hand: useImage(FACULTY_ART.hand),
    speech: useImage(FACULTY_ART.speech),
    heart: useImage(FACULTY_ART.heart),
  };
}

/** One object's artwork, from the board's set. */
export function artOf(art: ReturnType<typeof useFacultyArt>, id: string): SkImage | null {
  return id in art ? art[id as keyof typeof art] : null;
}
