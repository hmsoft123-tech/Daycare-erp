import type { AttendanceRecord } from "@/types";

const today = "2025-06-26";
const classId = "c1";

export const todayAttendance: AttendanceRecord[] = [
  { studentId: "s1", date: today, classId, status: "present" },
  { studentId: "s5", date: today, classId, status: "present" },
];

export function generateAttendanceHistory(studentId: string, weeks = 12): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const statuses: AttendanceRecord["status"][] = ["present", "present", "present", "present", "absent", "late"];
  for (let i = 0; i < weeks * 5; i++) {
    const d = new Date(2025, 5, 26);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    records.push({
      studentId,
      date: d.toISOString().split("T")[0],
      classId: "c1",
      status: statuses[i % statuses.length],
    });
  }
  return records;
}

export const classStudents = ["s1", "s5"];
