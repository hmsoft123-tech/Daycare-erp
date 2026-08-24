const ERP_API =
  process.env.NEXT_PUBLIC_ERP_API_URL?.replace(/\/$/, "") || "http://localhost:3000";

export async function fetchParentOps<T>(resource: string, fallback: T[]): Promise<T[]> {
  try {
    const url = new URL(`${ERP_API}/api/parent-ops`);
    url.searchParams.set("resource", resource);
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return fallback;
    const data = (await res.json()) as { items?: T[] };
    return data.items?.length ? data.items : fallback;
  } catch {
    return fallback;
  }
}

export async function postParentOps(body: Record<string, unknown>) {
  try {
    const res = await fetch(`${ERP_API}/api/parent-ops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}
