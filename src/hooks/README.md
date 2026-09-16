# src/hooks — shared hooks

Hooks used by more than one feature. A hook used by exactly one feature belongs
in that feature's `hooks/` folder.

## Rules

- One hook per file, `use-thing.ts` exporting `useThing`.
- Test beside it.

## Never goes here

- Hooks that reach for the network, the keychain, or any other side effect. Wrap
  the side effect in `@/core` and have the hook consume that.
- Anything feature-specific.

## May import

`@/hooks`, `@/utils`, `@/theme`, `@/types`. Never `@/features`, `@/core`, or
`@/app`.
