# legacy-intro-and-assets — deprecated

**Delete this folder when you're ready.** Nothing in the app imports from it.

These are the retired launch intros: the pool drawn live (ADR 0026), the water
drawn live (0027), the water movie (0028) and the pool movie in water (0029).
The app ships only the paint movie (ADR 0030; see ADR 0031).

The folder mirrors the original paths: `src/`, `tests/`, `assets/intro/`,
`docs/prototypes/`, `docs/adr/` and `scripts/`. Files that stayed in the app but
were trimmed for the paint movie (`LaunchIntro`, `LaunchStage`, `Arrive`, the
theme's tokens and launch colours, `app.config.ts`, the render scripts and their
tests) have a copy here as they were before the trim, so this is a complete
record of the old code.

None of it builds or runs as it stands: `tsconfig.json`, ESLint and Prettier
ignore this folder, and Jest and knip never look in it.

To delete it, remove this folder and its entries in `tsconfig.json`'s
`exclude`, ESLint's `globalIgnores` (`eslint.config.js`) and `.prettierignore`.
