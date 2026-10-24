# legacy-plans-library — retired

The Plans tab before its pages: the library as a list of coloured cards
(`LibraryPlanCard`) under a pinned header with In progress / Done filter
pills and the search (`PlansHeader`), its skeleton, and its view-model
(`use-plans-library`). The Plans tab became a stack of full-screen plan
pages (`src/features/plans/screens/PlansScreen.tsx`). Kept whole, on purpose.

The folder mirrors the original paths under `src/features/plans/`.
`logic/plan-filters.ts` is the file as it was: `src` keeps only what's still
used of it (`describeEmptyLibrary`, `PlanFilter`).

None of it builds or runs as it stands: `tsconfig.json`, ESLint and Prettier
ignore this folder, and Jest and knip never look in it. Its tests were left
under `tests/features/plans/`.

To delete it, remove this folder and its entries in `tsconfig.json`'s
`exclude`, ESLint's `globalIgnores` (`eslint.config.js`) and `.prettierignore`.
