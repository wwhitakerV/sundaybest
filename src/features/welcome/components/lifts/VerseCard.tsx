import { PassageCard } from "@/entities/scripture";
import { SCRIPTURE_WORDS, getScriptureScene } from "../../logic/scenes";
import type { LiftPieceProps } from "../../logic/lift-piece";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { Span } from "@/ui/typography/Span";

// Stable keys for the words; a word can repeat, its position can't.
const WORDS = SCRIPTURE_WORDS.map((text, position) => ({ key: `${position}-${text}`, text }));

/**
 * The verse, on the real passage card. As its scene plays, the words light up
 * one after another, as if someone were reading along; unread words sit quiet.
 */
export function VerseCard({ elapsedMs }: LiftPieceProps) {
  const { litWords } = getScriptureScene(elapsedMs);

  return (
    <PassageCard>
      <MonoLabel variant="emphasis">8 </MonoLabel>
      {WORDS.map(({ key, text }, position) => (
        <Span key={key} tone={position < litWords ? "text" : "border"}>
          {position < WORDS.length - 1 ? `${text} ` : text}
        </Span>
      ))}
    </PassageCard>
  );
}
