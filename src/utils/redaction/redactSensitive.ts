/**
 * A single redaction pass: what to look for, and what to put in its place.
 *
 * `redact` receives the match and any capture groups, so a rule can keep the
 * harmless part of a match (the `Bearer` scheme) while masking the secret.
 */
type RedactionRule = {
  readonly pattern: RegExp;
  readonly redact: (match: string, ...groups: string[]) => string;
};

/** Anything shorter is a word like "cafe"; anything longer is not a phone number. */
const PHONE_DIGIT_RANGE = { min: 7, max: 15 } as const;

/**
 * Rules run in this order, and **the order is load-bearing**:
 *
 * 1. `email` first, so an address is never mistaken for a phone number by the
 *    digits in its local part.
 * 2. `bearerToken` before `jwt` and `base64`, because a bearer credential is
 *    usually itself a JWT or a base64 blob. Matching the scheme first keeps the
 *    log line readable ("Bearer [redacted:token]") instead of collapsing the
 *    whole header.
 * 3. `jwt` before `hex`/`base64`, since each of its three segments is valid
 *    base64url and would otherwise be masked piecemeal.
 * 4. `hex` before `base64`, because hex digits are a strict subset of the
 *    base64 alphabet, so a 64-character digest matches both and the more
 *    specific label should win.
 * 5. `phone` last, once every long run of digits has already been masked. By
 *    then the only digit runs left are genuinely phone-shaped.
 *
 * Every replacement is bracketed text containing no digits and no "@", which is
 * what makes the function idempotent: running it over an already-redacted log
 * line is a no-op rather than a cascade.
 */
const RULES: readonly RedactionRule[] = [
  {
    pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
    redact: () => "[redacted:email]",
  },
  {
    pattern: /\b(bearer)\s+[A-Za-z0-9\-._~+/]+=*/gi,
    redact: (_match, scheme) => `${scheme} [redacted:token]`,
  },
  {
    // Three base64url segments. The 10-character floor keeps dotted hostnames
    // such as "mail.example.co.uk" out of it.
    pattern: /\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    redact: () => "[redacted:jwt]",
  },
  {
    // 32 hex characters is an MD5; digests are longer still.
    pattern: /\b[0-9a-fA-F]{32,}\b/g,
    redact: () => "[redacted:hex]",
  },
  {
    pattern: /\b[A-Za-z0-9+/]{40,}={0,2}/g,
    redact: () => "[redacted:base64]",
  },
  {
    // Deliberately loose about punctuation and bounded to avoid pathological
    // backtracking; the digit count below is what actually decides.
    pattern: /\+?\d[\d\s().-]{5,18}\d/g,
    redact: (match) => {
      const digits = match.replace(/\D/g, "").length;
      const isPhoneShaped = digits >= PHONE_DIGIT_RANGE.min && digits <= PHONE_DIGIT_RANGE.max;
      return isPhoneShaped ? "[redacted:phone]" : match;
    },
  },
];

/**
 * Masks likely-sensitive values anywhere in a string: email addresses, phone
 * numbers, bearer credentials, JWTs, and long hex or base64 blobs.
 *
 * Intended for anything that leaves the device or lands in a log. It is
 * deliberately eager — a false positive costs a slightly less readable log
 * line, a false negative leaks a secret.
 */
export function redactSensitive(input: string): string {
  return RULES.reduce((text, rule) => text.replace(rule.pattern, rule.redact), input);
}
