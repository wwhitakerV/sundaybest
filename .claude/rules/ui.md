---
paths:
  - "src/ui/**"
  - "src/features/*/components/**"
  - "src/features/*/screens/**"
  - "src/theme/**"
---

# UI rules

## Structure

- One component per file, named after the file (`PascalCase.tsx`). Its test
  mirrors the path under `tests/` (`tests/ui/organisms/Screen.test.tsx`).
- `src/ui` is sorted atomically: `typography/`, `atoms/`, `molecules/`,
  `organisms/` (see `src/ui/README.md` for what goes where). A part with private
  hooks keeps its own folder inside one (`organisms/tab-bar/`); a small system
  that isn't one component sits beside them (`burst/`, `header-entrance/`).
- About 250 lines a file at most. A long render becomes named components, not
  one long block of unnamed JSX.
- `src/ui/` is generic: if it could not appear unchanged in a different app, it
  belongs in the feature slice. It never knows an app route: a control that
  navigates takes what it does as a prop (the tab bar's `fab`).
- A `ui` component never imports `features`, `core`, or `app`. Data and callbacks
  arrive as props.

## Every component

- Accepts and forwards **`testID`**. Every interactive element has one, and so
  does anything a test needs to find. Put it on the outermost element the caller
  would target.
- Reads colour from `useTheme()`. **No hardcoded colour** — both a light and a
  dark value must exist for every token.
- Takes spacing, corners, and control heights from `space`, `radius`, and
  `controlHeight` (`import { space } from "@/theme"`), and a card's shell from
  `Card`. A number off the scales is a named constant with its reason (ADR
  0016).
- Draws text only with `src/ui/typography` components (a `variant` and a
  `tone`; `style` for layout only), and takes input with `TextField`. No
  react-native `Text`/`TextInput`, no `theme.typography` reads (ADR 0015).
- Has an accessibility label where the visual is the only cue, and a hit target
  of at least 44x44 points for anything tappable.
- Handles the empty, loading, and error states, or takes them as props. A screen
  with only a happy path is unfinished.

## iPhone only

Portrait, iPhone. No iPad layouts, no web-only APIs, no `Platform.OS === "web"`
branches. Respect the safe area by composing `Screen` rather than reimplementing
insets.

## Do not

- Do not reach for a new dependency for something `react-native` already does.
- Do not put business logic in a component; it belongs in the slice's hooks.
- Do not add an animation without checking `prefers-reduced-motion` behavior.
