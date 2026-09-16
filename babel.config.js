/**
 * Metro applies babel-preset-expo implicitly, so a managed Expo app needs no
 * Babel config to build. Jest does need one: babel-jest has no Expo defaults,
 * and React Native's own jest setup file still ships Flow type annotations
 * ("value(id: TimeoutID): void"), which fail to parse without the preset that
 * strips them.
 */
module.exports = function babelConfig(api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
  };
};
