# src/theme — design tokens

The single source of colour, spacing, radii, and type scale. Every token has a
light and a dark value.

## Belongs here

- `tokens.ts` — the raw scales plus `lightTheme` and `darkTheme`.
- `use-theme.ts` — `useTheme()`, which always resolves `lightTheme`. The app
  deliberately ignores the device's dark-mode setting: `app.config.ts` pins
  `userInterfaceStyle` to `light` so native chrome matches. `darkTheme` stays
  defined for the dark theme that gets designed later.

## Never goes here

- Component styles. A component keeps its own `StyleSheet` and reads tokens from
  `useTheme()`.
- Feature-specific values.

## May import

`@/theme`, `@/types`.
