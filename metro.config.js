const { getDefaultConfig } = require("expo/metro-config");

/**
 * Strips every `console.*` call from the production/release bundle at the
 * minifier level (`npx expo export`, no `--dev`) — confirmed against Expo's
 * current minify guide. This is the bundler-level backstop for
 * `src/core/monitoring/logger.ts`'s own runtime guarantee of never calling
 * console in production; two independent layers rather than trusting either
 * alone.
 *
 * Deliberately does NOT wrap this with `@sentry/react-native/metro`'s
 * `withSentryConfig`, which would add Debug IDs to the bundle and its source
 * maps. Tried first: with it, `npx expo export -p ios` fails bundling with
 * `TypeError: Cannot read properties of undefined (reading 'match')`, thrown
 * from inside the Sentry Metro serializer once it processes the real module
 * graph (not from `withSentryConfig` itself, which returns cleanly — the
 * failure only appears when Metro actually bundles). Source maps still upload
 * and still work without it: release/dist (see crash-reporter.ts) is what
 * correlates an event to a build, Debug IDs are a nicer correlation on top,
 * not a requirement. Revisit if `@sentry/react-native` ships a fix — check
 * this repo's installed version against the package's changelog first.
 */
const config = getDefaultConfig(__dirname);

config.transformer.minifierConfig = {
  compress: {
    drop_console: true,
  },
};

module.exports = config;
