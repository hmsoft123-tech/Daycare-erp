/**
 * Small, dependency-free guards shared by both portals.
 * These are defense-in-depth for the UI — the API must enforce the same rules.
 */

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** True only for `#rgb` / `#rrggbb` — safe to interpolate into CSS. */
export function isSafeHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

/**
 * Returns the URL only when it is absolute http(s) (or a same-origin path),
 * otherwise `undefined`. Blocks `javascript:`, `data:`, `vbscript:` etc. in
 * user-supplied links (virtual class join links, recordings, logos).
 */
export function safeExternalUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Cryptographically strong URL-safe token (for client-generated ids only — invites come from the API). */
export function secureRandomToken(bytes = 24): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Reads a cookie in the browser (e.g. Laravel Sanctum's `XSRF-TOKEN`). */
export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${encodeURIComponent(name)}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}
