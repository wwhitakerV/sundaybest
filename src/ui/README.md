# src/ui — design-system primitives

Generic, reusable building blocks: `Screen`, `Button`, `Text`, `Card`. If it
could appear in a different app unchanged, it belongs here.

## Rules

- One component per file, named after the component in `PascalCase.tsx`.
- Its test mirrors the path under `tests/` (`tests/ui/Screen.test.tsx`).
- A component with private hooks gets its own folder (`tab-bar/`: the component
  plus the hooks only it uses).
- Styling reads from `@/theme` — never hardcode a colour.

## Belongs here

- Presentational primitives with no knowledge of any feature.
- Props-in, JSX-out. Accept `testID` and forward it.

## Never goes here

- Anything feature-aware, or any data fetching, persistence, or navigation.
- Screens that represent a route — those are feature screens.

## May import

`@/ui`, `@/hooks`, `@/utils`, `@/theme`, `@/types`. Never `@/features`, `@/core`,
or `@/app`.
