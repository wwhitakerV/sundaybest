import { z } from 'zod';
import { FORMATION_ICON_NAMES } from './formation-icons.js';

/** Additive stage schemas for the existing outline → day → quiz pipeline.
 * Keep existing Reader's generatedDaySchema and API contracts; do not replace them.
 * Model-facing output Zod schemas must remain simple; enforce relation checks locally.
 */
export const CHARACTER_DOMAINS = [
  'attention', 'thinking', 'desire', 'speech', 'relationships', 'integrity',
  'discipline', 'stewardship', 'work', 'service', 'conflict', 'worship',
  'prayer', 'resistance', 'courage', 'rest', 'perseverance', 'discernment',
] as const;

export const FRUIT_IDS = [
  'love', 'joy', 'peace', 'patience', 'kindness', 'goodness',
  'faithfulness', 'gentleness', 'self-control',
] as const;

// Exactly 1–5 core outcomes, even if a sermon has more minor implications.
// These become stable categories of character being PURSUED, never claims of achievement.
export const formationOutcomeSchema = z.object({
  id: z.string().min(2).max(44),
  title: z.string().min(3).max(48),
  formationAim: z.string().min(15).max(220),
  domain: z.enum(CHARACTER_DOMAINS),
  spiritualFruitIds: z.array(z.enum(FRUIT_IDS)).max(3),
  evidenceQuote: z.string().min(12).max(450),
});

// Outline specifies all map nodes *before* day prose is generated.
export const formationMapNodeSchema = z.object({
  id: z.string().min(2).max(56),
  outcomeId: z.string().min(2).max(44),
  title: z.string().min(3).max(44),
  icon: z.enum(FORMATION_ICON_NAMES),
  applicationAngle: z.string().min(12).max(180),
  role: z.enum(['introduce', 'apply', 'reinforce']),
});

export const formationOutlineFragmentSchema = z.object({
  formationThesis: z.string().min(30).max(500),
  outcomes: z.array(formationOutcomeSchema).min(1).max(5),
  // Put mapNodes: formationMapNodeSchema[] INSIDE the existing outline days[].
});

export const formationVerseSchema = z.object({
  book: z.string().min(1).max(80),
  chapter: z.number().int().min(1).max(150),
  verseStart: z.number().int().min(1).max(176),
  verseEnd: z.number().int().min(1).max(176),
  reference: z.string().min(1).max(100),
  origin: z.enum(['sermon', 'supplemental']),
  support: z.enum(['direct', 'contextual', 'illustrative']),
  relevance: z.string().min(12).max(280),
});

export const formationEncounterSchema = z.object({
  nodeId: z.string().min(2).max(56),
  confrontation: z.string().min(25).max(280),
  recognition: z.array(z.string().min(20).max(180)).min(1).max(3),
  scriptures: z.array(formationVerseSchema).min(1).max(3),
});

export const formationCommitmentSchema = z.object({
  id: z.string().min(2).max(56),
  nodeId: z.string().min(2).max(56),
  action: z.string().min(24).max(210),
  domain: z.enum(CHARACTER_DOMAINS),
});

export const formationDayFragmentSchema = z.object({
  encounters: z.array(formationEncounterSchema).min(1).max(5),
  // Ten candidates across THE DAY (not ten per icon); each encounter gets ≥1.
  commitments: z.array(formationCommitmentSchema).length(10),
});

export type FormationOutlineFragment = z.infer<typeof formationOutlineFragmentSchema>;
export type FormationDayFragment = z.infer<typeof formationDayFragmentSchema>;
export type FormationMapNode = z.infer<typeof formationMapNodeSchema>;

/** Do not place these custom checks inside model-facing response_format schema;
 * apply them after parsing and BEFORE checkpointing/persistence.
 */
export function validateFormationCoverage(
  outcomes: readonly { id: string }[],
  days: readonly { mapNodes: readonly { id: string; outcomeId: string }[] }[],
): string[] {
  const errors: string[] = [];
  const outcomeIds = new Set(outcomes.map(x => x.id));
  const counts = new Map<string, number>();
  const nodeIds = new Set<string>();
  for (const day of days) {
    if (day.mapNodes.length < 1 || day.mapNodes.length > 5) errors.push('Every day needs 1–5 map nodes.');
    for (const node of day.mapNodes) {
      if (!outcomeIds.has(node.outcomeId)) errors.push(`Unknown outcome: ${node.outcomeId}`);
      if (nodeIds.has(node.id)) errors.push(`Duplicate node: ${node.id}`);
      nodeIds.add(node.id);
      counts.set(node.outcomeId, (counts.get(node.outcomeId) ?? 0) + 1);
    }
  }
  for (const outcome of outcomes) if (!counts.has(outcome.id)) errors.push(`Uncovered core outcome: ${outcome.id}`);
  return errors;
}

export function validateFormationDay(
  mapNodes: readonly { id: string }[],
  day: FormationDayFragment,
): string[] {
  const errors: string[] = [];
  const valid = new Set(mapNodes.map(x => x.id));
  const ids = new Set<string>();
  const count = new Map<string, number>();
  for (const e of day.encounters) {
    if (!valid.has(e.nodeId)) errors.push(`Encounter node not in outline: ${e.nodeId}`);
    if (ids.has(e.nodeId)) errors.push(`Duplicate encounter: ${e.nodeId}`);
    ids.add(e.nodeId);
  }
  for (const n of mapNodes) if (!ids.has(n.id)) errors.push(`Missing encounter: ${n.id}`);
  const uniqueActions = new Set<string>();
  const uniqueCommitmentIds = new Set<string>();
  for (const c of day.commitments) {
    if (!valid.has(c.nodeId)) errors.push(`Commitment references missing node: ${c.nodeId}`);
    if (uniqueCommitmentIds.has(c.id)) errors.push(`Duplicate commitment ID: ${c.id}`);
    uniqueCommitmentIds.add(c.id);
    const key = c.action.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
    if (uniqueActions.has(key)) errors.push(`Duplicate commitment action: ${c.id}`);
    uniqueActions.add(key);
    count.set(c.nodeId, (count.get(c.nodeId) ?? 0) + 1);
  }
  for (const n of mapNodes) if (!count.has(n.id)) errors.push(`No commitments for node: ${n.id}`);
  return errors;
}
