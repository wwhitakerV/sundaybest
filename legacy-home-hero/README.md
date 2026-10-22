# legacy-home-hero — deprecated

**Delete this folder when you're ready.** Nothing in the app imports from it.

Home's previous hero: the plan under way in a full-width gradient of its
sermon's colours, collapsing as Home scrolled into a plan bar pinned at the
top (`useHeroCollapse`, `ActivePlanBar`, `ArtworkFlight`). Home v2's
`FeaturedStudy` (an editorial page on white) replaced it.

The folder mirrors the original paths under `src/features/home/`, the
collapse and flight geometry (`logic/`) included. Start here kept three of
its numbers as its own. To bring the old hero back, move these files back
and restore `HomeScreen.tsx`, `use-home-view.ts` and `StartHereHero.tsx` from
git.

None of it builds or runs as it stands: `tsconfig.json`, ESLint and Prettier
ignore this folder, and Jest and knip never look in it.
