"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  assignStudentToClass,
  createClassroomActivity,
  updateClassRoom,
} from "@/lib/mock-service";
import { formatDate } from "@/lib/utils";
import type {
  ClassRoom,
  ClassroomActivity,
  ClassroomActivityType,
  Staff,
  Student,
} from "@/types";
import { toast } from "sonner";

const ACTIVITY_TYPES: { value: ClassroomActivityType; label: string }[] = [
  { value: "checkin", label: "Check-in" },
  { value: "checkout", label: "Check-out" },
  { value: "meal", label: "Meal" },
  { value: "nap", label: "Nap" },
  { value: "learning", label: "Learning" },
  { value: "activity", label: "Activity" },
  { value: "photo", label: "Photo note" },
  { value: "note", label: "Teacher note" },
  { value: "potty", label: "Potty" },
];

type Props = {
  room: ClassRoom;
  students: Student[];
  staff: Staff[];
  activities: ClassroomActivity[];
  branchName?: string;
};

export function ClassroomDetailClient({
  room: initialRoom,
  students: allStudents,
  staff,
  activities: initialActivities,
  branchName,
}: Props) {
  const [room, setRoom] = useState(initialRoom);
  const [students, setStudents] = useState(allStudents);
  const [activities, setActivities] = useState(initialActivities);
  const [addStudentId, setAddStudentId] = useState("");
  const [logStudentId, setLogStudentId] = useState("");
  const [logType, setLogType] = useState<ClassroomActivityType>("note");
  const [logTitle, setLogTitle] = useState("");
  const [logBody, setLogBody] = useState("");
  const [visibleToParents, setVisibleToParents] = useState(true);

  const roster = useMemo(
    () => students.filter((s) => s.classId === room.id),
    [students, room.id]
  );
  const teacher = staff.find((s) => s.id === room.teacherId);
  const branchTeachers = staff.filter(
    (s) =>
      s.branchId === room.branchId &&
      s.status === "active" &&
      (s.role === "teacher" || s.role === "admin" || s.role === "executive")
  );
  const assignableStudents = students.filter(
    (s) =>
      s.status === "active" &&
      s.classId !== room.id &&
      (s.branchId === room.branchId || true)
  );

  const assignTeacher = async (teacherId: string) => {
    const updated = await updateClassRoom(room.id, { teacherId });
    if (!updated) {
      toast.error("Teacher must belong to this classroom's branch");
      return;
    }
    setRoom(updated);
    toast.success("Teacher assigned to classroom");
  };

  const moveStudent = async () => {
    if (!addStudentId) return;
    const result = await assignStudentToClass(addStudentId, room.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setStudents((prev) => prev.map((s) => (s.id === result.student.id ? result.student : s)));
    setAddStudentId("");
    toast.success(`${result.student.firstName} assigned to ${room.name}`);
  };

  const postActivity = async () => {
    const student = roster.find((s) => s.id === logStudentId);
    if (!student) {
      toast.error("Select a student in this classroom");
      return;
    }
    if (!logTitle.trim() || !logBody.trim()) {
      toast.error("Title and details required");
      return;
    }
    const teacherStaff = staff.find((s) => s.id === room.teacherId);
    const activity = await createClassroomActivity({
      type: logType,
      title: logTitle.trim(),
      body: logBody.trim(),
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      classId: room.id,
      branchId: room.branchId,
      teacherId: room.teacherId,
      teacherName: teacherStaff?.name ?? "Teacher",
      visibleToParents,
    });
    setActivities((prev) => [activity, ...prev]);
    setLogTitle("");
    setLogBody("");
    toast.success(
      visibleToParents
        ? "Activity logged — visible on parent portal feed"
        : "Activity logged (internal only)"
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-heading">{room.name}</h2>
            <p className="text-sm text-muted">
              {branchName ?? room.branchId}
              {room.ageBand ? ` · ${room.ageBand}` : ""}
              {room.capacity != null ? ` · Cap ${room.capacity}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[200px]">
              <Label className="text-xs">Assigned teacher</Label>
              <Select value={room.teacherId} onValueChange={assignTeacher}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {branchTeachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" asChild>
              <Link href="/classrooms">← All classrooms</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Students in class ({roster.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {roster.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-[#F1F3F5] px-3 py-2 text-sm"
                >
                  <Link href={`/students/${s.id}`} className="font-medium text-brand-700 hover:underline">
                    {s.firstName} {s.lastName}
                  </Link>
                  <Badge variant="secondary" className="capitalize">{s.status}</Badge>
                </li>
              ))}
              {roster.length === 0 && (
                <p className="text-sm text-muted">No students assigned yet.</p>
              )}
            </ul>
            <div className="flex flex-col gap-2 border-t border-[#F1F3F5] pt-4 sm:flex-row">
              <Select value={addStudentId} onValueChange={setAddStudentId}>
                <SelectTrigger><SelectValue placeholder="Assign student…" /></SelectTrigger>
                <SelectContent>
                  {assignableStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                      {s.branchId !== room.branchId ? " (other branch → moves here)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={moveStudent} disabled={!addStudentId}>
                Assign
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log activity (parent feed)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted">
              Teacher: {teacher?.name ?? "—"}. Posts marked visible appear on the parent portal
              home feed.
            </p>
            <div>
              <Label>Student</Label>
              <Select value={logStudentId} onValueChange={setLogStudentId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {roster.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={logType} onValueChange={(v) => setLogType(v as ClassroomActivityType)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                className="mt-1"
                value={logTitle}
                onChange={(e) => setLogTitle(e.target.value)}
                placeholder="e.g. Lunch"
              />
            </div>
            <div>
              <Label htmlFor="body">Details</Label>
              <Textarea
                id="body"
                className="mt-1"
                rows={3}
                value={logBody}
                onChange={(e) => setLogBody(e.target.value)}
                placeholder="What happened…"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={visibleToParents}
                onChange={(e) => setVisibleToParents(e.target.checked)}
              />
              Show on parent portal
            </label>
            <Button type="button" className="w-full" onClick={postActivity}>
              Post activity log
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Classroom activity log</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted">No activity logged yet.</p>
          ) : (
            <ul className="space-y-3">
              {activities.map((a) => (
                <li key={a.id} className="rounded-xl border border-[#F1F3F5] p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="info" className="capitalize">{a.type}</Badge>
                      <span className="font-medium text-heading">{a.title}</span>
                      {a.visibleToParents ? (
                        <Badge variant="success">Parent feed</Badge>
                      ) : (
                        <Badge variant="secondary">Internal</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted">
                      {a.time} · {formatDate(a.createdAt.slice(0, 10))}
                    </span>
                  </div>
                  <p className="mt-1 text-muted">
                    {a.studentName} · logged by {a.teacherName}
                  </p>
                  <p className="mt-2 text-heading">{a.body}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
