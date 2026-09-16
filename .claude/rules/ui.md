---
paths:
  - "src/ui/**"
  - "src/features/*/components/**"
  - "src/features/*/screens/**"
  - "src/theme/**"
---

# UI rules

## Structure

- One component per file, named after the file (`PascalCase.tsx`), test beside it.
- `src/ui/` is generic: if it could not appear unchanged in a different app, it
  belongs in the feature slice.
- A `ui` component never imports `features`, `core`, or `app`. Data and callbacks
  arrive as props.

## Every component

- Accepts and forwards **`testID`**. Every interactive element has one, and so
  does anything a test needs to find. Put it on the outermost element the caller
  would target.
- Reads colour, spacing, radii, and type from `useTheme()`. **No hardcoded
  colour** — both a light and a dark value must exist for every token.
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
