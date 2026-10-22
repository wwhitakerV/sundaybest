# legacy-the-99 — retired

The 99, the first daily game: call a flock of 20 through a gate before the
wolf gets them. RISE replaced it as Home's daily game. It's kept whole here,
on purpose: nothing in it was deleted.

The folder mirrors the original paths:

- `src/features/the-99/` — the game's screen, view-model and results
- `src/entities/flock/` — its rules, daily board and drawing (worklets, Skia)
- `src/app/the-99.tsx` — its route
- `src/features/home/components/DailyGame.tsx`, `hooks/use-daily-game.ts` — its card on Home
- `src/core/haptics/the-99-haptics.ts` — `callFeedback` and `lockFeedback`,
  taken out of `src/core/haptics/haptics.ts`

None of it builds or runs as it stands: `tsconfig.json`, ESLint and Prettier
ignore this folder, and Jest and knip never look in it.

To bring it back: move each file to its path under `src/`, put the two haptics
back in `haptics.ts`, add `<Stack.Screen name="the-99" options={{ presentation:
"fullScreenModal", gestureEnabled: false }} />` to `src/app/_layout.tsx`, and
render `DailyGame` on Home. Its results are still kept (`game_results`, game
`"the-99"`), and `Game` in `src/core/storage/game-results.ts` still names it.

To delete it, remove this folder and its entries in `tsconfig.json`'s
`exclude`, ESLint's `globalIgnores` (`eslint.config.js`) and `.prettierignore`.
