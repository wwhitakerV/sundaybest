# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Working agreement

- **Verify against current docs, never memory.** Check every version, API, and
  config key against the Expo MCP server or the Expo skills / versioned docs before
  writing code. Assume anything you remember about Expo is out of date.
- **Install Expo SDK packages with `npx expo install`.** It resolves the version
  that matches this project's SDK. Pin exact versions (no `^`, no `~`) for every
  non-Expo dependency.
- **Use npm** for all installs and scripts, and use `npx` wherever a command would
  otherwise be run with another package runner.
- **Never read, print, or create real secrets.** No real values in code, logs,
  commits, or chat — `.env.example` placeholders only. If a step needs credentials,
  an account action, or a paid plan: stop, ask, and add the step to
  `docs/SETUP_CHECKLIST.md`.
- **Finish every task by running its verification steps**, then make a
  [Conventional Commit](https://www.conventionalcommits.org/).
