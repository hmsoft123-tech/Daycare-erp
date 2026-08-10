import {
  mockAssignments,
  mockAttendance,
  mockHomework,
  mockNotices,
  mockProgressReports,
  mockSyllabus,
  type AssignmentItem,
  type AttendanceRecord,
  type HomeworkItem,
  type NoticeItem,
  type ProgressReport,
  type SyllabusTopic,
} from "@/data/school";

const ERP_API =
  process.env.NEXT_PUBLIC_ERP_API_URL?.replace(/\/$/, "") || "http://localhost:3000";

export type SchoolResource =
  | "attendance"
  | "homework"
  | "assignments"
  | "progress"
  | "notices"
  | "syllabus";

async function fetchSchoolResource<T>(
  resource: SchoolResource,
  fallback: T[]
): Promise<T[]> {
  try {
    const url = new URL(`${ERP_API}/api/school`);
    url.searchParams.set("resource", resource);
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return fallback;
    const data = (await res.json()) as { items?: T[] };
    return data.items?.length ? data.items : fallback;
  } catch {
    return fallback;
  }
}

export function fetchSchoolAttendance() {
  return fetchSchoolResource<AttendanceRecord>("attendance", mockAttendance);
}

export function fetchSchoolHomework() {
  return fetchSchoolResource<HomeworkItem>("homework", mockHomework);
}

export function fetchSchoolAssignments() {
  return fetchSchoolResource<AssignmentItem>("assignments", mockAssignments);
}

export function fetchSchoolProgress() {
  return fetchSchoolResource<ProgressReport>("progress", mockProgressReports);
}

export function fetchSchoolNotices() {
  return fetchSchoolResource<NoticeItem>("notices", mockNotices);
}

export function fetchSchoolSyllabus() {
  return fetchSchoolResource<SyllabusTopic>("syllabus", mockSyllabus);
}
