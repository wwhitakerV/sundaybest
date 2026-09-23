/**
 * Stub. "Start day 1" is supposed to request native iOS notification
 * permission before continuing — a real system prompt, not an app screen.
 * `expo-notifications` is not installed yet (out of scope for this
 * navigation-only build); this keeps the call site in place so wiring the
 * real request later is a one-file change, not a new call site to find.
 */
export async function requestNotificationPermission(): Promise<void> {
  return Promise.resolve();
}
