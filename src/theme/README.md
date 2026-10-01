# src/theme — design tokens

The single source of colour, spacing, radii, type scale, and icon stroke weight (`theme.icon.strokeWidth`). Every token has a
light and a dark value.

## Belongs here

- `tokens.ts` — the raw scales plus `lightTheme` and `darkTheme`.
- `use-theme.ts` — `useTheme()`, which always resolves `lightTheme`. The app
  deliberately ignores the device's dark-mode setting: `app.config.ts` pins
  `userInterfaceStyle` to `light` so native chrome matches. `darkTheme` stays
  defined for the dark theme that gets designed later.

## Spacing, corners, and control heights

`space`, `radius`, and `controlHeight` are imported straight from `@/theme`
(`import { space, radius } from "@/theme"`) and used inside a component's
`StyleSheet.create`: they read the same in every theme. `space` and `radius`
name each step by its value (`space[22]`, `radius[28]`). A number that isn't on
a scale is one-off geometry: a named constant beside its component, with its
reason. Lint rejects raw spacing and corner numbers, and `theme.spacing` /
`theme.radii`, which only Fun and Exams still read (ADR 0016).

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
