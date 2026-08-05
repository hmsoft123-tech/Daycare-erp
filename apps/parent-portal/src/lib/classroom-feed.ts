import type { FeedItem } from "@/data/mock";

const ERP_API =
  process.env.NEXT_PUBLIC_ERP_API_URL?.replace(/\/$/, "") || "http://localhost:3000";

type ErpActivity = {
  id: string;
  type: FeedItem["type"];
  title: string;
  body: string;
  time: string;
  studentId: string;
  studentName: string;
  teacherName?: string;
  imageUrl?: string;
  likes?: number;
  visibleToParents?: boolean;
};

/** Fetch teacher classroom logs from admin ERP (parent-visible). */
export async function fetchClassroomFeed(studentIds?: string[]): Promise<FeedItem[]> {
  try {
    const url = new URL(`${ERP_API}/api/classroom-activities`);
    url.searchParams.set("parentsOnly", "1");
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { activities: ErpActivity[] };
    let list = data.activities ?? [];
    if (studentIds?.length) {
      const set = new Set(studentIds);
      list = list.filter((a) => set.has(a.studentId));
    }
    return list.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      body: a.teacherName ? `${a.body}\n— ${a.teacherName}` : a.body,
      time: a.time,
      childId: a.studentId,
      childName: a.studentName.split(" ")[0] ?? a.studentName,
      imageUrl: a.imageUrl,
      likes: a.likes,
      liked: false,
    }));
  } catch {
    return [];
  }
}
