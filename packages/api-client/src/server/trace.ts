/**
 * Dev-only trace of server → backend calls. With the BFF, these requests never
 * pass through the browser, so DevTools cannot show them — they are printed to
 * the `next dev` terminal instead. Secrets are masked. Off in production;
 * set LOG_BACKEND_CALLS=false to silence it in dev.
 */

/** JWTs and passwords only — business fields (CNIC, enrollmentToken…) stay visible for debugging. */
const SECRET_KEY = /^(token|accessToken|refreshToken|resetToken)$|pass(word)?|secret|authorization|otp/i;
const MAX_CHARS = 2000;

export function backendTraceEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.LOG_BACKEND_CALLS !== "false";
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        SECRET_KEY.test(k) && v != null && v !== "" ? "***" : redact(v),
      ])
    );
  }
  return value;
}

function format(text: string): string {
  let out = text;
  try {
    out = JSON.stringify(redact(JSON.parse(text)));
  } catch {
    /* not JSON — print as is */
  }
  return out.length > MAX_CHARS ? `${out.slice(0, MAX_CHARS)}… (${out.length} chars)` : out;
}

function describeBody(body: unknown, contentType: string): string | null {
  if (body == null) return null;
  if (typeof body === "string") return format(body);
  if (body instanceof ArrayBuffer) {
    if (/json|text/.test(contentType)) return format(new TextDecoder().decode(body));
    return `[${contentType.split(";")[0] || "binary"} · ${body.byteLength} bytes]`;
  }
  return "[stream]";
}

export async function traceBackend(call: {
  method: string;
  url: string;
  headers: Headers;
  body: unknown;
  response: Response | null;
  startedAt: number;
  error?: unknown;
}): Promise<void> {
  if (!backendTraceEnabled()) return;
  const ms = Date.now() - call.startedAt;
  const path = call.url.replace(/^https?:\/\/[^/]+/, "");
  const auth = call.headers.get("authorization") ? " · Bearer" : "";
  const lines: string[] = [];

  const location = call.response?.headers.get("location");
  if (call.response && call.response.status >= 300 && call.response.status < 400 && location) {
    // Redirects are never followed (credentials must not leak to another host),
    // so a moved API looks like "not found" — say so loudly.
    console.warn(
      `[backend] ⚠ ${call.method} ${path} was redirected to ${location}. ` +
        `Update API_BASE_URL in .env.local to the new address and restart.`
    );
  }

  if (!call.response) {
    lines.push(`[backend] ${call.method} ${path} ✗ ${(call.error as Error)?.message ?? "failed"} (${ms} ms)${auth}`);
  } else {
    lines.push(`[backend] ${call.method} ${path} → ${call.response.status} (${ms} ms)${auth}`);
  }
  const req = describeBody(call.body, call.headers.get("content-type") ?? "");
  if (req) lines.push(`  request  ${req}`);

  if (call.response) {
    const type = call.response.headers.get("content-type") ?? "";
    if (/json|text/.test(type)) {
      try {
        // clone() so the caller (or the browser, via the proxy) still gets the body
        const text = await call.response.clone().text();
        if (text) lines.push(`  response ${format(text)}`);
      } catch {
        /* body not readable — skip */
      }
    } else if (type) {
      lines.push(`  response [${type.split(";")[0]}]`);
    }
  }
  console.log(lines.join("\n"));
}
