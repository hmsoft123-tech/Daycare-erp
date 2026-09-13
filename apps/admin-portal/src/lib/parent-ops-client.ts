/** Admin UI → same-origin parent-ops API (server memory parent portal reads). */
export async function postParentOpsAction<T = unknown>(
  body: Record<string, unknown>
): Promise<{ ok: true; item: T } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/parent-ops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { item?: T; error?: string };
    if (!res.ok) {
      return { ok: false, error: data.error ?? "Request failed" };
    }
    return { ok: true, item: data.item as T };
  } catch {
    return { ok: false, error: "Network error" };
  }
}
