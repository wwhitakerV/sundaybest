# src/ui — design-system primitives

Generic, reusable building blocks: `Screen`, `Button`, `Card`, and the text
components in `typography/` (`SFProBody`, `MonoLabel`, `SerifTitle`, … — ADR
0015). If it could appear in a different app unchanged, it belongs here.

## Folders

Sorted by atomic design. Pick the smallest level that fits.

| Folder             | Holds                                                 | Examples                                          |
| ------------------ | ----------------------------------------------------- | ------------------------------------------------- |
| `typography/`      | Every piece of text, and text input                   | `SFProBody`, `MonoLabel`, `Wordmark`, `TextField` |
| `atoms/`           | One element                                           | `Button`, `Card`, `Divider`, `VideoThumbnail`     |
| `molecules/`       | A few atoms working together                          | `ScreenHeader`, `FilterTabs`, `FilterPills`       |
| `organisms/`       | A whole region of a screen                            | `Screen`, `LoadingScreen`, `tab-bar/`             |
| `header-entrance/` | How header buttons arrive as a screen comes into view | `HeaderArrivalProvider`, `HeaderEntranceScope`    |
| `burst/`           | The streak burst, shared by the tab bar and Welcome   | `StreakBurst`                                     |
| `hero/`            | A feature hero's words, and the colour behind them    | `HeroContent`, `HeroContentFade`                  |

The pieces left at the top of `src/ui` (`AnswerRow`, `Chip`, `LinkRow`, …) are
used only by Fun and Exams, which are outside the cleanup for now. They stay
where they are until those features are brought up to standard.

## Rules

- One component per file, named after the component in `PascalCase.tsx`.
- Its test mirrors the path under `tests/` (`tests/ui/organisms/Screen.test.tsx`).
- A component with private hooks gets its own folder (`organisms/tab-bar/`: the
  component, the named parts it's drawn from, and the hooks only it uses).
- About 250 lines a file at most. A long render is split into named components.
- Styling reads from `@/theme` — never hardcode a colour. Spacing, corners, and
  control heights come from `space`, `radius`, and `controlHeight` (ADR 0016).
- A card is a `Card`: the hairline edge, fill, and corners are its job; padding
  and gap come in through `style`.

## Belongs here

- Presentational primitives with no knowledge of any feature.
- Props-in, JSX-out. Accept `testID` and forward it.

## Never goes here

- Anything feature-aware, or any data fetching or persistence.
- A route. Nothing here knows where the app goes: a control that navigates takes
  what it does as a prop. The tab bar's floating button is `fab: { label,
onPress }`, and Home's `AppTabBar` supplies the New Plan route.
- Screens that represent a route — those are feature screens.

Reading navigation _state_ is fine when nothing app-specific is in it.
`HeaderArrivalProvider` watches which screen is in focus so header buttons can
animate in, and is told the tab roots by the root layout. It names no route of
its own, so it stays here.

## May import

`@/ui`, `@/hooks`, `@/utils`, `@/theme`, `@/types`. Never `@/features`, `@/core`,
or `@/app`.
