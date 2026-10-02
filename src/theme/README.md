# src/theme — design tokens

The single source of colour, spacing, radii, type scale, and icon stroke weight (`theme.icon.strokeWidth`). Every token has a
light and a dark value.

## Belongs here

- `tokens.ts` — the raw scales plus `lightTheme` and `darkTheme`.
- `use-theme.ts` — `useTheme()`: `lightTheme`, unless a surrounding
  `ThemeScope` hands down another. The app deliberately ignores the device's
  dark-mode setting: `app.config.ts` pins `userInterfaceStyle` to `light` so
  native chrome matches. App-wide dark mode gets designed later.
- `theme-scope.tsx` — `ThemeScope`: everything inside draws with the theme it's
  given. Used for the Daily Study's reading paper.
- Reading papers — `READING_PAPERS` (White, Ivory, Cream, Sepia, Dusk, Night) in
  `tokens.ts`, and `getReadingTheme(paper)`: a light paper is `lightTheme` with
  that background, a dark one `darkTheme` with it, so every ink and surface on it
  stays readable. Fixed colours, the same whatever the app's theme.

## Spacing, corners, and control heights

`space`, `radius`, and `controlHeight` are imported straight from `@/theme`
(`import { space, radius } from "@/theme"`) and used inside a component's
`StyleSheet.create`: they read the same in every theme. `space` and `radius`
name each step by its value (`space[22]`, `radius[28]`). A number that isn't on
a scale is one-off geometry: a named constant beside its component, with its
reason. Lint rejects raw spacing and corner numbers, and `theme.spacing` /
`theme.radii`, which only Fun and Exams still read (ADR 0016).

## Lines and edges

Greys are neutral or cool, never warm: a grey with more red than green or blue
reads as pink beside the white page (`tests/theme/colors.test.ts` holds every
neutral to it). On the light theme they step darker in one order — `surface`,
then `divider` (the hairline between rows), then `containerBorder` (the edge
of every card, grouped list, and soft button) — so a row's line always sits
quieter than its container's edge. `progressTrack` is the unfilled part of a
ring or scale; `grabber` is a sheet's drag indicator.

## Motion

`motion` is imported straight from `@/theme`, like the scales. `slide` is the
one spring every selection outline shares — Plan Detail's day, the paper, the
tab bar, Plans' filter — quick, with the least give. `snap` and `sheet` are
critically damped and clamped (`dampingRatio: 1`, `overshootClamping`): a
marker that must land dead still (the text-size dot), and a sheet rising from
the bottom edge. `exitMs` is how long anything takes to leave. Spread one into
`withSpring` with `reduceMotion: ReduceMotion.System`.

## Typography

`typography` holds the type roles. Components never read them directly: the
components in `src/ui/typography` map each `variant` to a role (ADR 0015). A
new size is a new named role here first. A role nothing in scope uses is
marked `/** @deprecated */` rather than deleted while exempt code (Fun, Exams)
might still read it.

## Never goes here

- Component styles. A component keeps its own `StyleSheet`, using the scales
  above, and reads colour from `useTheme()`.
- Feature-specific values.

## May import

`@/theme`, `@/types`.
