/**
 * Arbitrary extra fields attached to a log line or crash report. Every value
 * is redacted. Its own module so the logger and the crash reporter can both
 * use it without importing each other.
 */
export interface LogContext {
  readonly [key: string]: unknown;
}
