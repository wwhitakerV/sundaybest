// Flat config, layered on Expo's own config. Run `npm run lint`.
//
// Layer order matters: Expo's config first, then type-aware rules, then this
// project's rules, then eslint-config-prettier last so nothing fights Prettier.
const { defineConfig, globalIgnores } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const prettierConfig = require("eslint-config-prettier/flat");
const tseslint = require("typescript-eslint");
const boundaries = require("eslint-plugin-boundaries");
const security = require("eslint-plugin-security");
const jest = require("eslint-plugin-jest");
const testingLibrary = require("eslint-plugin-testing-library");
const globals = require("globals");

/** Test files, helpers, mocks, and fixtures — all under tests/, mirroring src/. */
const TEST_FILES = ["tests/**/*.{ts,tsx}"];

/** A slice's internals are private; only its index.ts is public. */
const FEATURE_ENTRY_POINT_ONLY = {
  group: ["@/features/*/*", "@/features/*/**"],
  message:
    "Import a feature only through its public entry point, e.g. @/features/home. Deep imports couple you to another slice's internals.",
};

/** ThemedText is the typography family's private base (ADR 0015). */
const THEMED_TEXT_PRIVATE = {
  group: ["@/ui/typography/ThemedText"],
  message:
    "ThemedText is the typography components' private base. Use SFProBody, MonoLabel, … instead.",
};

/** The same for an entity: only its index.ts is public (ADR 0017). */
const ENTITY_ENTRY_POINT_ONLY = {
  group: ["@/entities/*/*", "@/entities/*/**"],
  message:
    "Import an entity only through its public entry point, e.g. @/entities/plan. Deep imports couple you to its internals.",
};

/**
 * SDKs that touch the keychain, the network, device integrity, or a telemetry
 * backend. Importable inside src/core only. Listed ahead of installing them so a
 * later prompt cannot quietly wire one into a screen.
 */
const SIDE_EFFECT_SDKS_CORE_ONLY = {
  group: [
    // secure storage
    "expo-secure-store",
    "react-native-keychain",
    "react-native-encrypted-storage",
    "@react-native-async-storage/*",
    "expo-sqlite",
    // app integrity / attestation
    "expo-app-integrity",
    "@expo/app-integrity",
    "freerasp-react-native",
    "react-native-device-info",
    "jail-monkey",
    "react-native-root-detection",
    // networking
    "react-native-ssl-public-key-pinning",
    "axios",
    "ky",
    "superagent",
    "node-fetch",
    "@tanstack/react-query",
    // crash reporting
    "@sentry/*",
    "@bugsnag/*",
    "@react-native-firebase/*",
    // analytics (the product ships none; the rule keeps it that way)
    "posthog-react-native",
    "@amplitude/*",
    "@segment/*",
    "expo-insights",
    "expo-tracking-transparency",
    // screen capture and the app-switcher snapshot: a native side effect, and
    // the wrapper belongs in src/core/security/screen like everything else.
    "expo-screen-capture",
    // the clipboard: reads what the user copied elsewhere
    "expo-clipboard",
    // opening a web page: the one way content leaves for another site, so the
    // allowlist that guards it lives in src/core/links
    "expo-web-browser",
    // haptics and notifications: device side effects, wrapped in
    // src/core/haptics and src/core/notifications
    "expo-haptics",
    "expo-notifications",
  ],
  message:
    "SDKs with side effects may only be imported inside src/core. Wrap this in a src/core module and import that instead.",
};

/**
 * Where text may be drawn raw, or its type read straight from the theme — and
 * where spacing and corners may be raw numbers: the typography components
 * themselves, the theme, and src/core (which can't import src/ui — its one
 * text surface, the crash screen, reads theme roles). Fun and Exams — and the
 * src/ui pieces only they use — sit outside the typography and token
 * migrations for now (ADR 0015, ADR 0016).
 */
const RAW_TYPOGRAPHY_ALLOWED = [
  "src/ui/typography/**",
  "src/theme/**",
  "src/core/**",
  "src/features/fun/**",
  "src/features/exams/**",
  "src/app/(tabs)/fun/**",
  "src/app/exam/**",
  "src/app/exams/**",
  "src/ui/AnswerRow.tsx",
  "src/ui/Chip.tsx",
  "src/ui/FactRow.tsx",
  "src/ui/LinkButton.tsx",
  "src/ui/LinkRow.tsx",
  "src/ui/PillButton.tsx",
  "src/ui/SectionHeader.tsx",
  "src/ui/SheetLayout.tsx",
  "src/ui/Tag.tsx",
];

/**
 * Colour literals — hex (#fff, #1F5A6E, #1F5A6E80) and rgb()/rgba() — belong in
 * src/theme only: everything else reads a token from useTheme().
 */
const COLOUR_LITERALS = [
  {
    selector: "Literal[value=/^\\s*#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\s*$/]",
    message: "Colours come from the theme (useTheme().colors), not a hex literal.",
  },
  {
    selector: "Literal[value=/^\\s*(?:rgb|hsl)a?\\(/i]",
    message: "Colours come from the theme (useTheme().colors), not an rgb()/hsl() literal.",
  },
  {
    selector: "TemplateElement[value.raw=/(?:^|[^\\w])(?:#[0-9a-fA-F]{3,8}\\b|(?:rgb|hsl)a?\\()/i]",
    message: "Colours come from the theme (useTheme().colors), not a literal in a template string.",
  },
];

/** Where colour literals may live: the theme, and the mock data's sermon colours. */
const COLOUR_EXEMPT = ["src/theme/**", "src/core/mock-data/**"];

/** Files allowed to hold data, not logic, so they may run past the file-length limit. */
const LONG_DATA_FILES = [
  "src/theme/tokens.ts",
  "src/core/mock-data/**",
  "src/core/plan-builder/day-templates.ts",
];

/** Style keys that space things out, and the ones that round corners. */
const SPACING_PROP =
  "/^(gap|rowGap|columnGap|padding|margin)(Top|Bottom|Left|Right|Horizontal|Vertical|Start|End)?$/";
const RADIUS_PROP = "/^border(Top|Bottom|Start|End)?(Left|Right|Start|End)?Radius$/";
const SPACING_MESSAGE =
  "Spacing comes from the spacing scale (space[16]) or a named constant with its reason, not a raw number (ADR 0016).";

/** Text is drawn by src/ui/typography's components, never react-native's own. */
/**
 * react-native's own side-effect APIs — the share sheet, opening URLs and
 * apps, vibration — belong in src/core with the SDKs above.
 */
const RN_SIDE_EFFECTS_CORE_ONLY = {
  name: "react-native",
  importNames: ["Share", "Linking", "Vibration"],
  message:
    "Share, Linking, and Vibration are side effects: wrap them in src/core (see @/core/links, @/core/haptics) and import that.",
};

const RAW_TEXT_OUTSIDE_TYPOGRAPHY = {
  name: "react-native",
  importNames: ["Text", "TextInput"],
  message:
    "Draw text with a component from @/ui/typography (SFProBody, MonoLabel, …) and take input with TextField — they carry the brand's type and tones.",
};

/**
 * Config files and build scripts: default exports are the convention there, and
 * they run in Node rather than on a device.
 *
 * Split by module system, because `sourceType` is not a per-file guess. A `.ts`
 * or `.mjs` config uses real `import`/`export`, and parsing it as CommonJS fails
 * outright with "'import' and 'export' may appear only with sourceType: module"
 * — which is what happens to app.config.ts if it is lumped in with the rest.
 */
const CJS_CONFIG_FILES = [
  "eslint.config.js",
  "*.config.{js,cjs}",
  "*.config.*.{js,cjs}",
  "metro.config.js",
  "babel.config.js",
];

const ESM_CONFIG_FILES = ["*.config.{mjs,ts}", "*.config.*.{mjs,ts}", "scripts/**/*.{mjs,js}"];

const CONFIG_FILE_RULES = {
  "import/no-default-export": "off",
  // Build config runs at install/test time on paths it derives from __dirname,
  // and indexes its own literal objects. These two rules exist to catch
  // attacker-controlled paths and keys reaching app code, which is not what a
  // jest config does. They stay on everywhere else.
  "security/detect-non-literal-fs-filename": "off",
  "security/detect-object-injection": "off",
};

module.exports = defineConfig([
  globalIgnores([
    "dist/**",
    ".expo/**",
    "coverage/**",
    "ios/**",
    "android/**",
    "patches/**",
    "expo-env.d.ts",
  ]),

  // 1. Expo's recommended config (registers import, expo, react, react-hooks,
  //    and @typescript-eslint).
  expoConfig,

  // 1b. Teach the import graph about the @/* path alias.
  //
  //     Expo's config registers only the node resolver, while
  //     eslint-plugin-import's TypeScript config asks for a `typescript`
  //     resolver that ships nested inside eslint-config-expo and is not
  //     resolvable from the project root — which surfaces as
  //     "typescript with invalid interface loaded as resolver" and leaves every
  //     @/* import unresolved. That would silently disable boundaries/element-types,
  //     so the resolver is installed at the root and pointed at our tsconfig.
  {
    files: ["**/*.{ts,tsx}"],
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
        },
      },
    },
  },

  // 2. Security rules.
  security.configs.recommended,

  // 3. Type-aware rules for TypeScript only.
  {
    files: ["**/*.{ts,tsx}"],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
  },

  // 4. Architecture boundaries. See docs/adr/0001-feature-sliced-architecture.md
  //    and docs/adr/0017-entities-layer.md.
  //
  //    app -> features -> entities, ui, core, hooks, utils, theme, types
  //    entities -> entities, ui, hooks, utils, theme, types
  //    ui / hooks / utils never reach back into entities, features, core, or app
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["src/**/*"],
      // First match wins, so the feature pattern is listed before the rest.
      // Folder descriptors with the default (partial) matching: the pattern is
      // matched against the folder containing the file, and partial matching lets
      // it cover nested folders too.
      //
      // Do NOT write file-path patterns like "src/ui/**/*" here. Those match the
      // *folder*, which needs an extra segment, so nothing matches, every file
      // falls through as an unrecognised element, and the rule goes silently
      // inert while still reporting zero errors. `mode: "full"` fixes that but is
      // deprecated in v7, and `partialMatch: false` is NOT its replacement
      // (Settings.js treats it as effective folder mode). Verified with
      // deliberate violations - see docs/adr/0001.
      "boundaries/elements": [
        { type: "app", pattern: "src/app" },
        { type: "feature", pattern: "src/features/*", capture: ["feature"] },
        { type: "entities", pattern: "src/entities/*", capture: ["entity"] },
        { type: "core", pattern: "src/core" },
        { type: "ui", pattern: "src/ui" },
        { type: "hooks", pattern: "src/hooks" },
        { type: "utils", pattern: "src/utils" },
        { type: "theme", pattern: "src/theme" },
        { type: "types", pattern: "src/types" },
      ],
    },
    rules: {
      "boundaries/no-unknown-files": "off",
      // v7 rule name; "element-types" is the deprecated alias.
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          message:
            "{{ from.element.type }} is not allowed to import {{ to.element.type }}. See src/{{ from.element.type }}/README.md.",
          policies: [
            // Routes are the composition root and may reach anything.
            {
              from: { element: { type: "app" } },
              allow: {
                to: [
                  { element: { type: "app" } },
                  { element: { type: "feature" } },
                  { element: { type: "entities" } },
                  { element: { type: "core" } },
                  { element: { type: "ui" } },
                  { element: { type: "hooks" } },
                  { element: { type: "utils" } },
                  { element: { type: "theme" } },
                  { element: { type: "types" } },
                ],
              },
            },
            // A slice leans on the shared layers. Cross-feature imports are
            // narrowed to each slice's index.ts by no-restricted-imports below.
            {
              from: { element: { type: "feature" } },
              allow: {
                to: [
                  { element: { type: "feature" } },
                  { element: { type: "entities" } },
                  { element: { type: "core" } },
                  { element: { type: "ui" } },
                  { element: { type: "hooks" } },
                  { element: { type: "utils" } },
                  { element: { type: "theme" } },
                  { element: { type: "types" } },
                ],
              },
            },
            // Shared SundayBest concepts (ADR 0017): pure, props-in. They lean on
            // the generic layers and on each other, never on core, features, or
            // app. Cross-entity imports go through each entity's index.ts.
            {
              from: { element: { type: "entities" } },
              allow: {
                to: [
                  { element: { type: "entities" } },
                  { element: { type: "ui" } },
                  { element: { type: "hooks" } },
                  { element: { type: "utils" } },
                  { element: { type: "theme" } },
                  { element: { type: "types" } },
                ],
              },
            },
            // Core is the side-effect leaf: it must not know about the product.
            {
              from: { element: { type: "core" } },
              allow: {
                to: [
                  { element: { type: "core" } },
                  { element: { type: "utils" } },
                  { element: { type: "theme" } },
                  { element: { type: "types" } },
                ],
              },
            },
            // Presentation primitives stay generic.
            {
              from: { element: { type: "ui" } },
              allow: {
                to: [
                  { element: { type: "ui" } },
                  { element: { type: "hooks" } },
                  { element: { type: "utils" } },
                  { element: { type: "theme" } },
                  { element: { type: "types" } },
                ],
              },
            },
            {
              from: { element: { type: "hooks" } },
              allow: {
                to: [
                  { element: { type: "hooks" } },
                  { element: { type: "utils" } },
                  { element: { type: "theme" } },
                  { element: { type: "types" } },
                ],
              },
            },
            // Pure helpers depend on nothing but types.
            {
              from: { element: { type: "utils" } },
              allow: {
                to: [{ element: { type: "utils" } }, { element: { type: "types" } }],
              },
            },
            {
              from: { element: { type: "theme" } },
              allow: {
                to: [{ element: { type: "theme" } }, { element: { type: "types" } }],
              },
            },
            {
              from: { element: { type: "types" } },
              allow: { to: [{ element: { type: "types" } }] },
            },
          ],
        },
      ],
    },
  },

  // 5. This project's rules.
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Logging goes through src/core/monitoring (see override below).
      "no-console": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      // Named exports keep imports greppable and renames honest.
      "import/no-default-export": "error",
    },
  },

  // 5b. Feature slices are reachable only through their public entry point.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [FEATURE_ENTRY_POINT_ONLY, ENTITY_ENTRY_POINT_ONLY] },
      ],
    },
  },

  // 5c. SDKs with side effects are confined to src/core, which wraps them in a
  //     narrow typed API. This keeps the audited surface small: one folder to
  //     review when asking "what can this app actually reach?".
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [FEATURE_ENTRY_POINT_ONLY, ENTITY_ENTRY_POINT_ONLY, SIDE_EFFECT_SDKS_CORE_ONLY],
          paths: [RN_SIDE_EFFECTS_CORE_ONLY],
        },
      ],
    },
  },

  // 5c-bis. Text goes through src/ui/typography: no raw react-native Text or
  //         TextInput, and no type read straight off the theme (ADR 0015).
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: RAW_TYPOGRAPHY_ALLOWED,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            FEATURE_ENTRY_POINT_ONLY,
            ENTITY_ENTRY_POINT_ONLY,
            SIDE_EFFECT_SDKS_CORE_ONLY,
            THEMED_TEXT_PRIVATE,
          ],
          paths: [RAW_TEXT_OUTSIDE_TYPOGRAPHY, RN_SIDE_EFFECTS_CORE_ONLY],
        },
      ],
      "no-restricted-syntax": [
        "error",
        ...COLOUR_LITERALS,
        {
          selector: "MemberExpression[property.name='typography']",
          message:
            "Type comes from a @/ui/typography component's variant, not straight from theme.typography.",
        },
        {
          selector: "VariableDeclarator > ObjectPattern > Property[key.name='typography']",
          message:
            "Type comes from a @/ui/typography component's variant, not straight from theme.typography.",
        },
        {
          selector: `Property[key.name=${SPACING_PROP}][value.type='Literal'][value.raw=/^(?!0$)\\d/]`,
          message: SPACING_MESSAGE,
        },
        {
          selector: `Property[key.name=${SPACING_PROP}][value.type='UnaryExpression'][value.argument.type='Literal']`,
          message: SPACING_MESSAGE,
        },
        {
          selector: `Property[key.name=${RADIUS_PROP}][value.type='Literal'][value.raw=/^(?!0$)\\d/]`,
          message:
            "Corners come from the corner scale (radius[28], radius.pill) or a named constant with its reason, not a raw number (ADR 0016).",
        },
        {
          selector: "MemberExpression[property.name=/^(spacing|radii)$/]",
          message:
            'Read spacing and corners from the scales (import { space, radius } from "@/theme"); theme.spacing and theme.radii are Fun and Exams\' older names (ADR 0016).',
        },
      ],
    },
  },

  // 5c-ter. Inside an entity's logic/ or ui/, a relative import never climbs
  //         out of the entity: "../../plan/logic/x" is a deep import into
  //         another entity that the alias pattern can't see. Restates 5c-bis's
  //         patterns, because a later no-restricted-imports replaces an earlier
  //         one. Entities also never import each other in a cycle (ADR 0017).
  {
    files: ["src/entities/*/*/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            FEATURE_ENTRY_POINT_ONLY,
            ENTITY_ENTRY_POINT_ONLY,
            SIDE_EFFECT_SDKS_CORE_ONLY,
            THEMED_TEXT_PRIVATE,
            {
              group: ["../../*", "../../**"],
              message:
                "This climbs out of the entity. Import another entity through its index (@/entities/plan).",
            },
          ],
          paths: [RAW_TEXT_OUTSIDE_TYPOGRAPHY, RN_SIDE_EFFECTS_CORE_ONLY],
        },
      ],
    },
  },
  {
    files: ["src/entities/**/*.{ts,tsx}"],
    rules: { "import/no-cycle": "error" },
  },

  // 5c-quater. src/core is outside 5c-bis (it can't use src/ui), but holds no
  //            colour literals either — apart from the mock data.
  {
    files: ["src/core/**/*.{ts,tsx}"],
    ignores: COLOUR_EXEMPT,
    rules: { "no-restricted-syntax": ["error", ...COLOUR_LITERALS] },
  },
  // …and the rest of what 5c-bis skips (Fun, Exams, the typography components,
  // the ui pieces only they use) holds none either.
  {
    files: RAW_TYPOGRAPHY_ALLOWED.filter(
      (glob) => !glob.startsWith("src/theme") && !glob.startsWith("src/core"),
    ),
    rules: { "no-restricted-syntax": ["error", ...COLOUR_LITERALS] },
  },

  // 5c-quinquies. A file runs to 250 lines at most; a long render becomes named
  //               components, not one long block (see .claude/rules/ui.md).
  //               Data files are exempt, and so are Fun and Exams for now.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      ...LONG_DATA_FILES,
      "src/features/fun/**",
      "src/features/exams/**",
      "src/app/(tabs)/fun/**",
      "src/app/exam/**",
      "src/app/exams/**",
    ],
    rules: { "max-lines": ["error", { max: 250 }] },
  },

  // 5d. src/utils stays pure: no React, no I/O, no reaching into the app.
  {
    files: ["src/utils/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            FEATURE_ENTRY_POINT_ONLY,
            ENTITY_ENTRY_POINT_ONLY,
            SIDE_EFFECT_SDKS_CORE_ONLY,
            {
              group: [
                "react",
                "react/*",
                "react-dom",
                "react-native",
                "react-native/*",
                "react-native-*",
                "expo",
                "expo-*",
                "@expo/*",
                "@react-native*",
                "@react-native*/*",
                "node:*",
                "fs",
                "fs/*",
                "path",
                "os",
                "crypto",
                "http",
                "https",
                "child_process",
              ],
              message:
                "src/utils must stay pure: no React, no I/O. Move anything with a side effect to src/core and keep the helper deterministic.",
            },
          ],
        },
      ],
    },
  },

  // 6. The one place allowed to talk to the console directly.
  {
    files: ["src/core/monitoring/**/*.{ts,tsx}"],
    rules: { "no-console": "off" },
  },

  // 7. Expo Router discovers routes by default export, so src/app must use them.
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: { "import/no-default-export": "off" },
  },

  // 8. Config files and build scripts, in Node.
  {
    files: CJS_CONFIG_FILES,
    languageOptions: {
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
    rules: CONFIG_FILE_RULES,
  },
  {
    files: ESM_CONFIG_FILES,
    languageOptions: {
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: CONFIG_FILE_RULES,
  },

  // 9. Test files only: Jest and Testing Library.
  {
    files: TEST_FILES,
    extends: [jest.configs["flat/recommended"], testingLibrary.configs["flat/react"]],
    languageOptions: { globals: { ...globals.jest } },
    settings: {
      // jest/no-deprecated-functions resolves the installed jest to pick its
      // deprecations, and throws if jest is absent. Prompt 4 installs jest-expo
      // ~57.0.5, which builds on Jest 29, so state that here instead of letting
      // the rule crash lint whenever a test file exists before then.
      jest: { version: 29 },
    },
  },

  // 10. Plain JS (config files, scripts) is not covered by the TS program.
  {
    files: ["**/*.{js,cjs,mjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // 11. Prettier last: turns off every stylistic rule that would fight it.
  prettierConfig,
]);
