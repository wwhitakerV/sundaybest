/**
 * SundayBest v3 formation-map icon registry.
 * Exact Lucide kebab-case names: allowlist, NOT a request to render/import all 1,900+ Lucide icons.
 * Keep this on the API as plain strings. In React Native, explicitly map these names to
 * lucide-react-native imports (or generate that map in a build step).
 * Version this enum alongside generation/schema/DB changes.
 */
export const FORMATION_ICON_NAMES = [
  // Faculties and attention
  'eye', 'eye-off', 'ear', 'brain', 'brain-circuit', 'speech',
  'message-circle', 'message-square', 'messages-square',
  'hand', 'hand-heart', 'hand-helping', 'handshake', 'hand-coins',
  'footprints', 'biceps-flexed',
  // Inner life and spiritual fruit
  'heart', 'heart-crack', 'heart-handshake', 'heart-pulse', 'heart-plus',
  'flame', 'droplet', 'sprout', 'leaf', 'flower-2', 'tree-pine',
  'sun', 'sunrise', 'moon', 'wind', 'cloud',
  // Scripture and Christian practices
  'book-open', 'book-open-text', 'book-heart', 'scroll-text',
  'cross', 'church', 'notebook-pen', 'pencil',
  // Vigilance, boundaries, endurance, courage
  'shield', 'shield-check', 'shield-alert', 'shield-plus',
  'anchor', 'lock', 'lock-open', 'key-round', 'flag',
  'mountain', 'compass', 'navigation', 'route', 'map', 'map-pin', 'target',
  'binoculars', 'telescope',
  // Discernment and decisions
  'lightbulb', 'scale', 'gavel', 'triangle-alert', 'check',
  'circle-check', 'check-check', 'repeat-2', 'refresh-cw',
  // Time, discipline, work, stewardship, service
  'clock', 'hourglass', 'calendar-days', 'timer', 'alarm-clock',
  'house', 'house-heart', 'users', 'user-round',
  'briefcase-business', 'coins', 'wallet', 'gift',
  // Engagement and encouragement
  'sparkles', 'gem', 'crown', 'award', 'bell', 'activity', 'zap',
] as const;
export type FormationIconName = (typeof FORMATION_ICON_NAMES)[number];
export const FORMATION_ICON_SET: ReadonlySet<string> = new Set(FORMATION_ICON_NAMES);
