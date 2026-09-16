# SundayBest — project values

Canonical project facts. Later setup prompts read this file instead of re-asking.

## Identity

| Key | Value |
| --- | --- |
| App name | SundayBest |
| Slug | `sundaybest` |
| URL scheme | `sundaybest` |
| Production bundle ID | `com.walterwhitaker.sundaybest` |
| Expo owner (username) | `walterwhitakerv` |
| Expo account email | `walt.whitakerv@gmail.com` |
| GitHub repo | `wwhitakerV/sundaybest` |
| Package manager | npm (exec command: `npx`) |
| Staging API base URL | `api.sundaybest.com` |
| Code owners | `@wwhitakerv` |

## Product constraints

- iOS only for now — no Android, no web.
- iPhone only — no iPad (`ios.supportsTablet: false`).
- Free — no in-app purchases, no subscriptions.
- No user accounts and no sign-in.
- No ads.
- No tracking — no analytics SDKs, no IDFA, no third-party telemetry.

## Toolchain

| Key | Value | Source of truth |
| --- | --- | --- |
| Expo SDK | 57 (`expo@~57.0.23`) | npm `expo@latest`, checked 2026-09-15 |
| React Native | 0.86.3 | SDK 57 bundled version |
| React | 19.2.3 | SDK 57 bundled version |
| Node | 24.21.0 (Krypton LTS) | `.nvmrc`, `engines.node` |
| TypeScript | `~6.0.3` | template default |

Node 24.21.0 satisfies React Native 0.86.3's declared requirement
(`^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`).

## Dependency security pins

`npm audit` must stay at zero. Three pins in `package.json` `overrides` keep it
there without moving off Expo SDK 57:

| Pin | Why |
| --- | --- |
| `xcode > uuid@11.1.1` | uuid@7 missed a buffer bounds check in v3/v5/v6. Build-time only (`xcode` calls `uuid.v4()`); 11.1.1 still ships CJS. |
| `query-string > decode-uri-component@0.5.0` | `<=0.4.2` decodes malformed percent-encoding in exponential time. It ships in the iOS bundle via expo-router's deep-link parsing, so a crafted `sundaybest://` link could hang the JS thread. |
| `react-dom@19.2.3` | Not a dependency (iOS only), but Expo declares it as an optional peer and npm will hoist a copy. Pinning stops it drifting ahead of `react@19.2.3`. |

`decode-uri-component@0.5.0` is the only patched release and is ESM-only, so
`query-string@7.1.3`'s CJS `require` of it returns a module namespace instead of a
function. `patches/expo-router++query-string+7.1.3.patch` makes that one require
interop-aware; `patch-package` reapplies it on every install via `postinstall`.

Do not bump `query-string` to 9.x to fix this: 9.x is `export default` only, so
expo-router's `__importStar(require("query-string")).stringify` becomes `undefined`
and every navigation with params throws.

## Layout

- `src/app/` — expo-router routes only (screens and layouts).
- `src/` — all other application code.
- `docs/` — project documentation, including `SETUP_CHECKLIST.md`.
