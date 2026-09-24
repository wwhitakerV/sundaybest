/** Whether a pasted link can be used: the link to use, or why not. */
export type LinkCheck = { valid: true; url: string } | { valid: false; message: string };

const EMPTY_MESSAGE = "Paste a link to a sermon video.";
const INVALID_MESSAGE = "That doesn't look like a link. Try copying it again.";

/**
 * A light check of a pasted sermon link: trimmed, with `https://` added if
 * it was left off, and shaped like a web address — a host with a dot and no
 * spaces. Whether the video itself works is found out when the plan is built.
 */
export function checkSermonLink(input: string): LinkCheck {
  const trimmed = input.trim();
  if (!trimmed) return { valid: false, message: EMPTY_MESSAGE };
  const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const host = /^https?:\/\/([^/?#]+)/i.exec(url)?.[1] ?? "";
  const labels = (host.split(":").at(0) ?? "").split(".");
  const looksValid =
    !/\s/.test(url) && labels.length >= 2 && labels.every((label) => /^[a-z0-9-]+$/i.test(label));
  return looksValid ? { valid: true, url } : { valid: false, message: INVALID_MESSAGE };
}

/** A link cut down to its last part for the preview row: `…/watch?v=Qm81xRz4`. */
export function shortenLink(url: string): string {
  const last = url.replace(/\/+$/, "").split("/").at(-1) ?? url;
  return `…/${last}`;
}
