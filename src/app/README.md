# src/app — Expo Router routes

Route files only. Expo Router turns every file here into a navigable URL, so this
folder is the app's routing table and nothing else.

## Belongs here

- One-line re-exports of feature screens:
  `export { HomeScreen as default } from "@/features/home";`
- Layouts (`_layout.tsx`), `+not-found.tsx`, route groups (`(tabs)`).
- Default exports — Expo Router discovers routes by default export, which is why
  `import/no-default-export` is switched off for this folder alone.

## Plan Detail from Home

`(tabs)/home/` is a stack of its own, and `(tabs)/home/[planId]` re-exports the
same Plan Detail screen as `(tabs)/plans/[planId]`. Home's plan card opens it
there, so the push stays inside one native stack — iOS's zoom transition
(`Link.AppleZoom`) only runs within a stack, never across tabs.

## Header buttons arriving

The root layout mounts `HeaderArrivalProvider` with the tab bar's root screens,
and every navigator's layout sets `screenLayout={headerEntranceLayout}`. Whenever
the app arrives at a screen, that screen's header buttons animate in. The one
exception is moving between two tab roots, first visits included, which never
animates. A new navigator needs the same `screenLayout`, and a new tab root goes
in `TAB_ROOTS`.

## Never goes here

- Business logic, data fetching, state, or styling. Put it in the feature slice.
- Tests. Test the feature screen, not the route that re-exports it.
- Anything imported by another folder. Nothing outside `src/app` may import from
  `src/app`.

## May import

`@/features/*` (via their `index.ts`), and `@/core`, `@/ui`, `@/hooks`, `@/utils`,
`@/theme`, `@/types`.
