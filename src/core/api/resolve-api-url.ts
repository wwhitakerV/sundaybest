import Constants from "expo-constants";

/**
 * A physical phone cannot reach the Mac through `localhost` — that hostname
 * points back at the phone. In Expo Go development, reuse Metro's LAN host and
 * keep the API's configured port/path. Preview/production URLs are never
 * rewritten.
 */
export function resolveApiBaseUrl(configuredUrl: string, development: boolean): string {
  if (!development) return configuredUrl.replace(/\/$/, "");

  const parsed = new URL(configuredUrl);
  if (!isLoopback(parsed.hostname)) return configuredUrl.replace(/\/$/, "");

  const metroHost = readMetroHost();
  if (!metroHost) return configuredUrl.replace(/\/$/, "");

  parsed.hostname = metroHost;
  return parsed.toString().replace(/\/$/, "");
}

function isLoopback(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

function readMetroHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;

  try {
    const withScheme = /^https?:\/\//i.test(hostUri) ? hostUri : `http://${hostUri}`;
    return new URL(withScheme).hostname || null;
  } catch {
    return null;
  }
}
