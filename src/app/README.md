# src/app — Expo Router routes

Route files only. Expo Router turns every file here into a navigable URL, so this
folder is the app's routing table and nothing else.

## Belongs here

- One-line re-exports of feature screens:
  `export { HomeScreen as default } from "@/features/home";`
- Layouts (`_layout.tsx`), `+not-found.tsx`, route groups (`(tabs)`).
- Default exports — Expo Router discovers routes by default export, which is why
  `import/no-default-export` is switched off for this folder alone.

## Never goes here

- Business logic, data fetching, state, or styling. Put it in the feature slice.
- Tests. Test the feature screen, not the route that re-exports it.
- Anything imported by another folder. Nothing outside `src/app` may import from
  `src/app`.

## May import

`@/features/*` (via their `index.ts`), and `@/core`, `@/ui`, `@/hooks`, `@/utils`,
`@/theme`, `@/types`.
