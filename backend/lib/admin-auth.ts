// Shared admin auth helpers. We store a SHA-256 hex of ADMIN_PASSWORD in the
// cookie rather than the password itself — if the cookie ever leaks into a log
// or backup, the plain password doesn't go with it.

export const ADMIN_COOKIE = "wim_admin";
export const ADMIN_SESSION_DAYS = 30;

/// WebCrypto SHA-256 — runs on any Next 16 runtime (Node or Edge).
export async function hashPassword(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/// Constant-time comparison for the cookie check.
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
