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

/** Test files. Prompt 4 adds the actual test setup; the scoping is ready for it. */
const TEST_FILES = [
  "**/*.{test,spec}.{ts,tsx}",
  "**/__tests__/**/*.{ts,tsx}",
  "**/__mocks__/**/*.{ts,tsx}",
  "test/**/*.{ts,tsx}",
];

/** A slice's internals are private; only its index.ts is public. */
const FEATURE_ENTRY_POINT_ONLY = {
  group: ["@/features/*/*", "@/features/*/**"],
  message:
    "Import a feature only through its public entry point, e.g. @/features/home. Deep imports couple you to another slice's internals.",
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
    "react-native-device-info",
    "jail-monkey",
    "react-native-root-detection",
    // networking
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
  ],
  message:
    "SDKs with side effects may only be imported inside src/core. Wrap this in a src/core module and import that instead.",
};

/** Config files legitimately use default exports and run in Node. */
const CONFIG_FILES = [
  "eslint.config.js",
  "*.config.{js,cjs,mjs,ts}",
  "*.config.*.{js,cjs,mjs,ts}",
  "metro.config.js",
  "babel.config.js",
];

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

  // 4. Architecture boundaries. See docs/adr/0001-feature-sliced-architecture.md.
  //
  //    app -> features -> ui, core, hooks, utils, theme, types
  //    ui / hooks / utils never reach back into features, core, or app
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
                  { element: { type: "core" } },
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
      "no-restricted-imports": ["error", { patterns: [FEATURE_ENTRY_POINT_ONLY] }],
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
        { patterns: [FEATURE_ENTRY_POINT_ONLY, SIDE_EFFECT_SDKS_CORE_ONLY] },
      ],
    },
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

  // 8. Config files: default exports are the convention, and they run in Node.
  {
    files: CONFIG_FILES,
    languageOptions: {
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
    rules: {
      "import/no-default-export": "off",
      // Build config runs at install/test time on paths it derives from
      // __dirname, and indexes its own literal objects. These two rules exist
      // to catch attacker-controlled paths and keys reaching app code, which is
      // not what a jest config does. They stay on everywhere else.
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-object-injection": "off",
    },
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
