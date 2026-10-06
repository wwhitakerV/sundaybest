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

The pieces left at the top of `src/ui` (`AnswerRow`, `Chip`, `LinkRow`, …) are
used only by Fun and Exams, which are outside the cleanup for now. They stay
where they are until those features are brought up to standard.

## Inventory

What's here, so a new screen composes before it builds. Text goes through
`typography/` (variant + tone); see ADR 0015 for each component's variants.

| Piece                                                                                                                                                        | What it's for                                                                                                                                                                      | Variants / options                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **typography/** `Wordmark`, `DisplayTitle`, `SerifTitle`, `SerifBody`, `SFProTitle`, `SFProBody`, `SFProLabel`, `MonoLabel`, `MonoBody`, `Span`, `TextField` | All text, and text input                                                                                                                                                           | a `variant` per role and a semantic `tone`                    |
| `TextSizeScope`                                                                                                                                              | Grows or shrinks the text inside it by a number of points                                                                                                                          | `offset`                                                      |
| **atoms/** `Button`                                                                                                                                          | The full-width action                                                                                                                                                              | `primary`, `soft`, `secondary`; optional `icon`; `loading`    |
| `CompactButton`                                                                                                                                              | A smaller action set on a colour                                                                                                                                                   | `tone`: `light`, `dark`, `accent`, `soft`; `icon`, `iconOnly` |
| `HeaderIconButton`                                                                                                                                           | A round icon button in a header                                                                                                                                                    | `overlay` for colour behind it; `size`                        |
| `FloatingButton`                                                                                                                                             | A screen's own action where the floating bars are                                                                                                                                  | `primary`, `quiet`                                            |
| `Card`                                                                                                                                                       | A card's shell: the container edge, fill, corners; tappable whole                                                                                                                  | `radius`, `fill`: `surface` or `page`; `onPress`; `edge`      |
| `IconRing`                                                                                                                                                   | A large soft ring round one accent icon, always an outline (a milestone page's mark)                                                                                               | `icon`                                                        |
| `Divider`, `BottomFade`, `GradientBackdrop`, `SheetGrabber`                                                                                                  | A hairline; a fade to the page; a colour gradient (with a washed image); a sheet's drag indicator                                                                                  | —                                                             |
| `VideoThumbnail`                                                                                                                                             | A sermon's 16:9 still, with its duration                                                                                                                                           | —                                                             |
| `ProgressRing`, `ProgressDial`, `StepProgress`, `StepCounter`                                                                                                | Progress: a large ring, a small still one beside a title, a segmented line, an "N of M"                                                                                            | `StepProgress` `ink`                                          |
| `Spinner`                                                                                                                                                    | The app's one spinner: an unfilled ring with an accent arc turning on it — never a system spinner                                                                                  | `size`                                                        |
| **molecules/** `ScreenHeader`, `TitleHeader`                                                                                                                 | A screen's header row; a large title header                                                                                                                                        | `left` / `right` slots                                        |
| `FilterTabs`, `FilterPills`                                                                                                                                  | A row of filters with counts: borderless, or as pills                                                                                                                              | —                                                             |
| `StatCard`                                                                                                                                                   | A number over its label, on a card                                                                                                                                                 | —                                                             |
| `StepScale`                                                                                                                                                  | A value picked along a ruled line between a small A and a large A, with − and +                                                                                                    | `min`, `max`, `step`                                          |
| **organisms/** `Screen`                                                                                                                                      | A screen's frame: safe area and page inset                                                                                                                                         | `padded`, `edges`                                             |
| `NotFoundScreen`                                                                                                                                             | What a screen shows when what it's for isn't there                                                                                                                                 | title, message, one action                                    |
| `MilestoneScreen`                                                                                                                                            | A milestone page — a day done, a plan ready, complete or preparing, a quiz to start or its score: one fixed layout, content passed in                                              | `mark`, `title`, `subtitle`, `badge`, `header`, `footer`      |
| `ScrollScreen`                                                                                                                                               | A page that scrolls between a pinned header and footer: the scroll view full width, the page inset inside it and on the header and footer                                          | `header`, `footer`, `overlay`, `contentStyle`                 |
| `ListScreen`                                                                                                                                                 | `ScrollScreen` for a long list of items, drawn as they scroll into view (a `FlatList`)                                                                                             | `data`, `renderItem`, `keyExtractor`, `empty`, `contentStyle` |
| `ScrollFrame`                                                                                                                                                | The frame both share: the screen inset only top and bottom, the page inset on the header and footer (`SCROLL_INSET`)                                                               | `header`, `footer`, `overlay`, `style`                        |
| `ScreenFooter`                                                                                                                                               | A screen's pinned buttons, at the one height every screen keeps them (`FOOTER_BOTTOM`)                                                                                             | `style`                                                       |
| `FeedbackPanel`                                                                                                                                              | A verdict at the foot in its colour — a quiz answer checked, a link that won't work — in place of the footer, its button where the footer's was                                    | `tone`, `title`, `detail`                                     |
| `BottomSheet`                                                                                                                                                | A sheet over the bottom half of the screen, sliding up as iOS's do                                                                                                                 | —                                                             |
| `PopoverMenu`                                                                                                                                                | A menu that grows from the button that opened it                                                                                                                                   | `items`, `anchor`                                             |
| `LoadingScreen`                                                                                                                                              | The app's first frame                                                                                                                                                              | —                                                             |
| `tab-bar/` `TabBar`, `TabIcon`                                                                                                                               | The floating tab bar and its icons; a screen's button beside or above it (`useTabBarAccessory`), and one banner floating above the tabs (`useTabBarBanner`) — the plan being built | `fab`                                                         |
| `floatingNavBar`                                                                                                                                             | Geometry and clearance for floating bars                                                                                                                                           | —                                                             |
| **header-entrance/** `HeaderArrivalProvider`, `HeaderEntranceScope`                                                                                          | How header buttons arrive on a screen                                                                                                                                              | —                                                             |
| **burst/** `StreakBurst`                                                                                                                                     | The streak burst of sparks                                                                                                                                                         | —                                                             |

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
