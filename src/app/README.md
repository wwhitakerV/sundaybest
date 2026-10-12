# src/app — Expo Router routes

Route files only. Expo Router turns every file here into a navigable URL, so this
folder is the app's routing table and nothing else.

## Belongs here

- One-line re-exports of feature screens:
  `export { HomeScreen as default } from "@/features/home";`
- Layouts (`_layout.tsx`): navigator configuration only — the screen list,
  `presentation` and sheet options, `screenLayout`, constants like `TAB_ROOTS`.
  No business logic, data access, or navigation handlers; a navigator's own
  pieces (the tab bar) come from a feature (`AppTabBar`).
- `+not-found.tsx`, route groups (`(tabs)`).
- Default exports — Expo Router discovers routes by default export, which is why
  `import/no-default-export` is switched off for this folder alone.

## Pages that open in whichever tab you're in

Every tab is its own stack, and a page opened from a tab opens in that tab, as
iOS does: Back returns to where the reader was, never to another tab. So Plan
Detail (`[planId]`) is in every tab's stack — Home, Plans, Progress, and
Settings — and so are the Settings pages a plan's More menu leads to:
`daily-reminder`, `how-plans-are-made`, `privacy-policy`, `privacy/[topic]`,
`bible-translation`, and `text-size`. Each copy is the same one-line re-export. The Study, a full-screen modal with its own stack, has
its own `study/bible-translation`, so a translation changed mid-study returns to
the passage.
Links build them with `@/entities/tabs` and the tab in focus (`useFocusedTab`).
Home's plan card also needs this for iOS's zoom transition (`Link.AppleZoom`),
which only runs within a stack, never across tabs.

Every tab layout sets `unstable_settings = { anchor: "index" }`, so a deep link,
or a link with `withAnchor`, puts the tab's first page underneath. A tab tapped
again always goes to its first page, even if a link left its stack without it
(`stackRootReset` in the tab bar). A new page a plan can reach needs a copy in
every tab, and a new tab needs the copies and the anchor.

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
