"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  ParentSchoolAssignment,
  ParentSchoolAttendance,
  ParentSchoolHomework,
  ParentSchoolNotice,
  ParentSchoolProgress,
  ParentSchoolSyllabus,
  SchoolResource,
  Student,
} from "@/types";

type Tab = Exclude<SchoolResource, "attendance"> | "attendance" | "planner";

const tabs: { id: Tab; label: string; hint: string }[] = [
  { id: "planner", label: "Planner", hint: "Daily / monthly / HO standard planner (discuss with Laiba)" },
  { id: "attendance", label: "Attendance", hint: "Marked under Attendance · synced to parents" },
  { id: "homework", label: "Homework", hint: "Daily / weekly home tasks" },
  { id: "assignments", label: "Assignments", hint: "Projects & graded work" },
  { id: "progress", label: "Progress", hint: "Term progress reports" },
  { id: "notices", label: "Notices", hint: "School announcements" },
  { id: "syllabus", label: "Syllabus", hint: "Weekly themes & units" },
];

type AcademicsManagerProps = {
  students: Student[];
  attendance: ParentSchoolAttendance[];
  homework: ParentSchoolHomework[];
  assignments: ParentSchoolAssignment[];
  progress: ParentSchoolProgress[];
  notices: ParentSchoolNotice[];
  syllabus: ParentSchoolSyllabus[];
};

function shortName(s: Student) {
  return s.firstName;
}

export function AcademicsManager({
  students,
  attendance,
  homework,
  assignments,
  progress,
  notices,
  syllabus,
}: AcademicsManagerProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("planner");
  const [pending, startTransition] = useTransition();
  const active = students.filter((s) => s.status === "active");

  const refresh = () => {
    startTransition(() => router.refresh());
  };

  const postCreate = async (resource: SchoolResource, data: Record<string, unknown>) => {
    const res = await fetch("/api/school", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource, data }),
    });
    if (!res.ok) {
      toast.error("Could not save");
      return;
    }
    toast.success("Saved — visible on parent portal School tab");
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#F1F3F5] bg-surface p-4">
        <p className="text-sm font-semibold text-heading">Parent School feed</p>
        <p className="mt-1 text-xs text-muted">
          Content you add here is served via <code className="text-[11px]">/api/school</code> and
          shown in the parent portal under School (Attendance, Homework, Assignments, Progress,
          Notices, Syllabus).
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              tab === t.id ? "bg-brand-500 text-white" : "bg-bg text-muted hover:text-heading"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted">{tabs.find((t) => t.id === tab)?.hint}</p>

      {tab === "planner" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-semibold">Daily planner</p>
              <p className="text-xs text-muted">
                First Academics input per FE review. Day structure to be finalized with Laiba.
              </p>
              <Input placeholder="Theme / focus for today" />
              <Textarea rows={4} placeholder="Blocks · circle time · outdoor · meals…" />
              <Button type="button" onClick={() => toast.success("Daily planner saved (demo)")}>
                Save daily
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-semibold">Academic monthly planner</p>
              <p className="text-xs text-muted">Month overview · units · assessments (format TBD with Laiba).</p>
              <Input type="month" defaultValue="2026-09" />
              <Textarea rows={4} placeholder="Monthly goals and lesson overview…" />
              <Button type="button" variant="outline" onClick={() => toast.success("Monthly planner saved (demo)")}>
                Save monthly
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-semibold">HO standard planner</p>
              <p className="text-xs text-muted">
                Head Office standard academic planner shell — branch follows HO template.
              </p>
              <div className="rounded-xl bg-bg px-3 py-2 text-xs text-muted">
                Status · Draft template · formats will be shared
              </div>
              <Button type="button" variant="secondary" onClick={() => toast.message("HO planner view (demo)")}>
                View HO template
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "attendance" && (
        <AttendanceList rows={attendance} onGoMark={() => router.push("/attendance")} />
      )}
      {tab === "homework" && (
        <HomeworkPanel
          rows={homework}
          students={active}
          pending={pending}
          onCreate={(data) => postCreate("homework", data)}
        />
      )}
      {tab === "assignments" && (
        <AssignmentPanel
          rows={assignments}
          students={active}
          pending={pending}
          onCreate={(data) => postCreate("assignments", data)}
        />
      )}
      {tab === "progress" && (
        <ProgressPanel
          rows={progress}
          students={active}
          pending={pending}
          onCreate={(data) => postCreate("progress", data)}
        />
      )}
      {tab === "notices" && (
        <NoticePanel
          rows={notices}
          pending={pending}
          onCreate={(data) => postCreate("notices", data)}
        />
      )}
      {tab === "syllabus" && (
        <SyllabusPanel
          rows={syllabus}
          students={active}
          pending={pending}
          onCreate={(data) => postCreate("syllabus", data)}
        />
      )}
    </div>
  );
}

function AttendanceList({
  rows,
  onGoMark,
}: {
  rows: ParentSchoolAttendance[];
  onGoMark: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted">{rows.length} records synced to parents</p>
        <Button type="button" size="sm" onClick={onGoMark}>
          Mark roll call
        </Button>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.slice(0, 24).map((r) => (
          <li key={r.id}>
            <Card>
              <CardContent className="flex items-center justify-between gap-2 p-3">
                <div>
                  <p className="text-sm font-semibold">{r.childName}</p>
                  <p className="text-xs text-muted">{r.date}</p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {r.status}
                </Badge>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StudentSelect({
  students,
  value,
  onChange,
}: {
  students: Student[];
  value: string;
  onChange: (id: string, name: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>Student</Label>
      <Select
        value={value}
        onValueChange={(id) => {
          const s = students.find((x) => x.id === id);
          if (s) onChange(id, shortName(s));
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select student" />
        </SelectTrigger>
        <SelectContent>
          {students.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.firstName} {s.lastName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function HomeworkPanel({
  rows,
  students,
  pending,
  onCreate,
}: {
  rows: ParentSchoolHomework[];
  students: Student[];
  pending: boolean;
  onCreate: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [childId, setChildId] = useState(students[0]?.id ?? "");
  const [childName, setChildName] = useState(students[0] ? shortName(students[0]) : "");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [dueOn, setDueOn] = useState("2026-08-12");
  const [instructions, setInstructions] = useState("");

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold">Add homework</p>
          <StudentSelect
            students={students}
            value={childId}
            onChange={(id, name) => {
              setChildId(id);
              setChildName(name);
            }}
          />
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Due date</Label>
            <Input type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Instructions</Label>
            <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} />
          </div>
          <Button
            type="button"
            disabled={pending || !title || !childId}
            onClick={() =>
              onCreate({
                childId,
                childName,
                title,
                subject: subject || "General",
                assignedOn: new Date().toISOString().slice(0, 10),
                dueOn,
                status: "pending",
                instructions,
              }).then(() => {
                setTitle("");
                setInstructions("");
              })
            }
          >
            Publish to parents
          </Button>
        </CardContent>
      </Card>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl border border-[#F1F3F5] bg-surface p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{r.title}</p>
                <p className="text-xs text-muted">
                  {r.childName} · {r.subject} · due {r.dueOn}
                </p>
              </div>
              <Badge variant="secondary" className="capitalize">
                {r.status}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted">{r.instructions}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AssignmentPanel({
  rows,
  students,
  pending,
  onCreate,
}: {
  rows: ParentSchoolAssignment[];
  students: Student[];
  pending: boolean;
  onCreate: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [childId, setChildId] = useState(students[0]?.id ?? "");
  const [childName, setChildName] = useState(students[0] ? shortName(students[0]) : "");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [dueOn, setDueOn] = useState("2026-08-15");
  const [brief, setBrief] = useState("");

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold">Add assignment</p>
          <StudentSelect
            students={students}
            value={childId}
            onChange={(id, name) => {
              setChildId(id);
              setChildName(name);
            }}
          />
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Due date</Label>
            <Input type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Brief</Label>
            <Textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={3} />
          </div>
          <Button
            type="button"
            disabled={pending || !title || !childId}
            onClick={() =>
              onCreate({
                childId,
                childName,
                title,
                subject: subject || "General",
                assignedOn: new Date().toISOString().slice(0, 10),
                dueOn,
                status: "open",
                brief,
              }).then(() => {
                setTitle("");
                setBrief("");
              })
            }
          >
            Publish to parents
          </Button>
        </CardContent>
      </Card>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl border border-[#F1F3F5] bg-surface p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{r.title}</p>
                <p className="text-xs text-muted">
                  {r.childName} · {r.subject} · due {r.dueOn}
                </p>
              </div>
              <Badge variant="secondary" className="capitalize">
                {r.status}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted">{r.brief}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProgressPanel({
  rows,
  students,
  pending,
  onCreate,
}: {
  rows: ParentSchoolProgress[];
  students: Student[];
  pending: boolean;
  onCreate: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [childId, setChildId] = useState(students[0]?.id ?? "");
  const student = useMemo(() => students.find((s) => s.id === childId), [students, childId]);
  const [term, setTerm] = useState("Term 1 · 2026");
  const [overall, setOverall] = useState("");
  const [comment, setComment] = useState("");

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold">Issue progress report</p>
          <StudentSelect
            students={students}
            value={childId}
            onChange={(id) => setChildId(id)}
          />
          <div className="space-y-1.5">
            <Label>Term</Label>
            <Input value={term} onChange={(e) => setTerm(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Overall</Label>
            <Input value={overall} onChange={(e) => setOverall(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Teacher comment</Label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
          </div>
          <Button
            type="button"
            disabled={pending || !student || !overall}
            onClick={() =>
              onCreate({
                childId,
                childName: `${student!.firstName} ${student!.lastName}`,
                term,
                className: student!.className ?? "Class",
                issuedOn: new Date().toISOString().slice(0, 10),
                overall,
                areas: [
                  { label: "Classroom routines", level: "developing", note: "See teacher comment." },
                  { label: "Learning", level: "developing", note: "Steady progress." },
                ],
                teacherComment: comment,
              }).then(() => {
                setOverall("");
                setComment("");
              })
            }
          >
            Publish to parents
          </Button>
        </CardContent>
      </Card>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl border border-[#F1F3F5] bg-surface p-3">
            <p className="text-sm font-semibold">
              {r.childName} · {r.term}
            </p>
            <p className="text-xs text-muted">
              {r.className} · issued {r.issuedOn}
            </p>
            <p className="mt-1 text-sm">{r.overall}</p>
            <p className="mt-1 text-xs text-muted">{r.teacherComment}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NoticePanel({
  rows,
  pending,
  onCreate,
}: {
  rows: ParentSchoolNotice[];
  pending: boolean;
  onCreate: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<"normal" | "important">("normal");

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold">Post notice</p>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as "normal" | "important")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="important">Important</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            disabled={pending || !title || !body}
            onClick={() =>
              onCreate({
                title,
                body,
                date: new Date().toISOString().slice(0, 10),
                audience: "all",
                priority,
              }).then(() => {
                setTitle("");
                setBody("");
              })
            }
          >
            Publish to parents
          </Button>
        </CardContent>
      </Card>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl border border-[#F1F3F5] bg-surface p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold">{r.title}</p>
              {r.priority === "important" && <Badge>Important</Badge>}
            </div>
            <p className="mt-1 text-xs text-muted">{r.date}</p>
            <p className="mt-1 text-sm text-heading">{r.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SyllabusPanel({
  rows,
  students,
  pending,
  onCreate,
}: {
  rows: ParentSchoolSyllabus[];
  students: Student[];
  pending: boolean;
  onCreate: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [childId, setChildId] = useState(students[0]?.id ?? "");
  const [childName, setChildName] = useState(students[0] ? shortName(students[0]) : "");
  const [subject, setSubject] = useState("");
  const [unit, setUnit] = useState("");
  const [weekOf, setWeekOf] = useState("2026-08-11");
  const [topics, setTopics] = useState("");

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold">Add syllabus unit</p>
          <StudentSelect
            students={students}
            value={childId}
            onChange={(id, name) => {
              setChildId(id);
              setChildName(name);
            }}
          />
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Unit</Label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Week of</Label>
            <Input type="date" value={weekOf} onChange={(e) => setWeekOf(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Topics (comma-separated)</Label>
            <Textarea value={topics} onChange={(e) => setTopics(e.target.value)} rows={3} />
          </div>
          <Button
            type="button"
            disabled={pending || !subject || !unit || !childId}
            onClick={() =>
              onCreate({
                childId,
                childName,
                subject,
                unit,
                weekOf,
                topics,
              }).then(() => {
                setSubject("");
                setUnit("");
                setTopics("");
              })
            }
          >
            Publish to parents
          </Button>
        </CardContent>
      </Card>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl border border-[#F1F3F5] bg-surface p-3">
            <p className="text-sm font-semibold">
              {r.subject} · {r.unit}
            </p>
            <p className="text-xs text-muted">
              {r.childName} · week of {r.weekOf}
            </p>
            <p className="mt-1 text-xs text-heading">{r.topics.join(" · ")}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
