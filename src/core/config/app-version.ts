import Constants from "expo-constants";

/** The app's version, as `app.config.ts` sets it ("1.0.0") — or null if it can't be read. */
export function getAppVersion(): string | null {
  return Constants.expoConfig?.version ?? null;
}
