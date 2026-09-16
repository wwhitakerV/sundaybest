# src/theme — design tokens

The single source of colour, spacing, radii, and type scale. Every token has a
light and a dark value.

## Belongs here

- `tokens.ts` — the raw scales plus `lightTheme` and `darkTheme`.
- `use-theme.ts` — `useTheme()`, which resolves the active theme from the OS
  colour scheme.

## Never goes here

- Component styles. A component keeps its own `StyleSheet` and reads tokens from
  `useTheme()`.
- Feature-specific values.

## May import

`@/theme`, `@/types`.
