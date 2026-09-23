const fs = require("fs");
const path = require("path");

/**
 * Folders held to a stricter bar than the global threshold.
 *
 * Jest fails a per-path coverageThreshold entry whose path has no collected
 * coverage with "Jest: Coverage data for ./src/core/security/ was not found",
 * and src/core/security is still empty (later prompts fill it). So the strict
 * entry is attached only once a folder actually contains source files. The
 * threshold becomes live the moment the first file lands there — it is never
 * permanently relaxed, and nothing has to be remembered later.
 */
const STRICT_COVERAGE_PATHS = ["src/utils", "src/core/security"];
const STRICT_THRESHOLD = { lines: 95, branches: 95, functions: 95, statements: 95 };

function containsSourceFile(dir) {
  const absolute = path.join(__dirname, dir);
  if (!fs.existsSync(absolute)) return false;

  const pending = [absolute];
  while (pending.length > 0) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(entryPath);
        continue;
      }
      const isSource =
        /\.tsx?$/.test(entry.name) &&
        !/\.(test|spec)\.tsx?$/.test(entry.name) &&
        !entry.name.endsWith(".d.ts") &&
        entry.name !== "types.ts";
      if (isSource) return true;
    }
  }
  return false;
}

const strictThresholds = Object.fromEntries(
  STRICT_COVERAGE_PATHS.filter(containsSourceFile).map((dir) => [`./${dir}/`, STRICT_THRESHOLD]),
);

/**
 * msw resolves to its TypeScript source under React Native's export condition,
 * and it plus several of its dependencies ship ESM only. jest-expo's allowlist
 * covers React Native and Expo packages, so these are appended to its existing
 * negative lookahead rather than replacing it — clobbering that pattern would
 * stop React Native itself from being transformed.
 */
const EXTRA_TRANSFORMED_PACKAGES = [
  "msw",
  "@mswjs",
  "@bundled-es-modules",
  "@open-draft",
  "rettime",
  "until-async",
  "strict-event-emitter",
  "headers-polyfill",
  "outvariant",
  "is-node-process",
  "cookie",
  "tough-cookie",
  "type-fest",
  "statuses",
  "path-to-regexp",
  "graphql",
  // Reached via expo-router -> query-string. decode-uri-component is pinned to
  // 0.5.0 by the security override in package.json (see docs/PROJECT.md), and
  // that release is ESM-only. Metro transforms it; Jest will not unless it is
  // listed here.
  "decode-uri-component",
  // lucide-react-native ships ESM only. Metro transforms it; Jest will not
  // unless it is listed here.
  "lucide-react-native",
];

const expoPreset = require("jest-expo/ios/jest-preset");

const ALLOWLIST_PREFIX = "/node_modules/(?!(";
const transformIgnorePatterns = expoPreset.transformIgnorePatterns.map((pattern) =>
  pattern.startsWith(ALLOWLIST_PREFIX)
    ? pattern.replace(
        ALLOWLIST_PREFIX,
        `${ALLOWLIST_PREFIX}${EXTRA_TRANSFORMED_PACKAGES.join("|")}|`,
      )
    : pattern,
);

/**
 * jest-expo transforms "\\.[jt]sx?$", which does not match the .mjs files that
 * ESM-only dependencies ship. Those files then load untransformed and fail with
 * "Cannot use import statement outside a module". Widen that one entry to cover
 * .mjs/.cjs and leave the asset transforms alone.
 */
const JS_TRANSFORM_KEY = "\\.[jt]sx?$";
const transform = { ...expoPreset.transform };
const jsTransform = transform[JS_TRANSFORM_KEY];
delete transform[JS_TRANSFORM_KEY];
transform["\\.[cm]?[jt]sx?$"] = jsTransform;

/** @type {import('jest').Config} */
module.exports = {
  // iOS-only project, so only the iOS project runs. The universal preset would
  // also spin up android and web.
  preset: "jest-expo/ios",

  transform,
  transformIgnorePatterns,

  setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.ts"],

  // Merged with the preset's own mappings (asset stubs), not replacing them.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@tests/(.*)$": "<rootDir>/tests/$1",
    // expo-router/testing-library's own mocks.js (required unconditionally by
    // expo-router/testing-library, which tests/helpers/render.tsx imports) sets up
    // react-native-reanimated's *own* mock.js for Jest. That mock is correct
    // in shape but, on this installed reanimated version, transitively
    // requires react-native-worklets (reanimated's native runtime moved into
    // its own package) — the real one, which needs a native turbo module
    // that does not exist under Jest and throws at import time. Mapping this
    // one transitive dependency to worklets' own bundled mock (which exists
    // for exactly this purpose) lets reanimated's real mock succeed instead
    // of crashing, with no need to fight expo-router's jest.mock() call for
    // control of react-native-reanimated itself.
    "^react-native-worklets$": "<rootDir>/node_modules/react-native-worklets/lib/module/mock.js",
  },

  // Tests live in tests/, mirroring src/ — never beside the code they cover.
  testMatch: ["<rootDir>/tests/**/*.test.{ts,tsx}"],

  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    // Routes are one-line re-exports; they are covered by tests/integration.
    "!src/app/**",
    // Type-only files have nothing to execute.
    "!src/types/**",
    "!src/**/*.d.ts",
    "!src/**/types.ts",
    // Scaffold, not shipped code.
    "!src/features/_template/**",
  ],

  coverageThreshold: {
    global: { lines: 80, branches: 80, functions: 80, statements: 80 },
    ...strictThresholds,
  },

  clearMocks: true,
  restoreMocks: true,
};
