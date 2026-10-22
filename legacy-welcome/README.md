# legacy-welcome — deprecated

**Delete this folder when you're ready.** Nothing in the app imports from it.

The retired Welcome screen: the phone tour and its two ways in (start a plan,
or try the sample), which marked the reader onboarded on the server. Home's
welcome (`src/features/home`, "No plans yet") replaced it as the first run,
and the launch now goes straight to Home.

The folder mirrors the original path, `src/features/welcome/`. Its tests were
left where they were, under `tests/features/welcome/`.

None of it builds or runs as it stands: `tsconfig.json`, ESLint and Prettier
ignore this folder, and Jest and knip never look in it.

To delete it, remove this folder and its entries in `tsconfig.json`'s
`exclude`, ESLint's `globalIgnores` (`eslint.config.js`) and `.prettierignore`.

Still in the app, unused since: the API's `POST /v1/me/onboarding/complete`
(`api.user.completeOnboarding` in `src/core/api/sundaybest-api.ts`) and the
reader's `onboardedAt`. Nothing decides anything from them now — Home decides a
newcomer by their having no plan of their own.
