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

  // 4. eslint-plugin-boundaries: registered and given its element map now so the
  //    architecture is described in one place. Prompt 3 turns on the rules.
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["src/**/*"],
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**/*" },
        { type: "core", pattern: "src/core/*/**/*", capture: ["module"] },
        { type: "features", pattern: "src/features/*/**/*", capture: ["feature"] },
        { type: "shared", pattern: "src/shared/*/**/*", capture: ["module"] },
      ],
    },
    // No boundaries/* rules yet — prompt 3 adds them.
    rules: {},
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
    rules: { "import/no-default-export": "off" },
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
