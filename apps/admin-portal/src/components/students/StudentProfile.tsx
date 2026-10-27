"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AllergyBanner } from "./AllergyBanner";
import { AttendanceHeatmap } from "./AttendanceHeatmap";
import { StatusPill } from "@/components/billing/StatusPill";
import { ViewIdCardButton } from "@/components/id-cards/ViewIdCardButton";
import { GenerateLetterButton } from "@/components/documents/GenerateLetterButton";
import { StudentExtrasPanel } from "@/components/students/StudentExtrasPanel";
import { StudentLifecycleActions } from "@/components/students/StudentLifecycleActions";
import { StudentTherapyPanel } from "@/components/students/StudentTherapyPanel";
import { branches } from "@/data/branches";
import { branchLabel, useBranches } from "@/lib/hooks/use-branches";
import { isBillableStudent } from "@/lib/eligibility";
import { calculateAge, formatDate, getInitials } from "@/lib/utils";
import { getMandatoryForms } from "@/lib/mock-service";
import type {
  Student,
  Parent,
  StudentNote,
  MedicalIncident,
  AttendanceRecord,
  TherapySession,
} from "@/types";
import type { MandatoryFormSubmission } from "@/data/extended-ops";
import { StudentTodayStrip } from "@/components/students/StudentTodayStrip";
import { HealthRecordList } from "@/components/health/HealthRecordList";
import { TIMING_SLOT_LABEL, timingRange, type CurrentAttendance } from "@/lib/student-timing";
import type { HealthRecord } from "@/types";

const MANDATORY_FORM_LABELS: Record<MandatoryFormSubmission["kind"], string> = {
  pick_drop_details: "Pick & Drop Details",
  parent_consent: "Parent Consent Form",
};

interface StudentProfileProps {
  student: Student;
  parents: Parent[];
  notes: StudentNote[];
  medicalIncidents: MedicalIncident[];
  attendance: AttendanceRecord[];
  therapySessions?: TherapySession[];
  currentAttendance?: CurrentAttendance;
  healthRecords?: HealthRecord[];
  /** Loaded from the API: hides the browser-only lifecycle actions and billing extras */
  apiBacked?: boolean;
  /** Extra tabs (API-backed fees, balance, transfers), shown first */
  extraTabs?: { value: string; label: string; content: ReactNode }[];
}

export function StudentProfile({
  student: initial,
  parents,
  notes,
  medicalIncidents,
  attendance,
  therapySessions = [],
  currentAttendance,
  healthRecords = [],
  apiBacked = false,
  extraTabs = [],
}: StudentProfileProps) {
  const [student, setStudent] = useState(initial);
  useEffect(() => setStudent(initial), [initial]);
  const { branches: apiBranches } = useBranches();
  const branch = branches.find((b) => b.id === student.branchId);
  const prevBranch = student.previousBranchId
    ? branches.find((b) => b.id === student.previousBranchId)
    : undefined;

  const [mandatoryForms, setMandatoryForms] = useState<MandatoryFormSubmission[]>([]);
  useEffect(() => {
    if (apiBacked) return;
    void getMandatoryForms(student.id).then(setMandatoryForms);
  }, [student.id, apiBacked]);

  return (
    <div className="space-y-6">
      <AllergyBanner allergies={student.allergies} />

      <StudentTodayStrip student={student} attendance={currentAttendance} />

      <div className="flex flex-col gap-6 md:flex-row">
        <Card className="md:w-80">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <Avatar className="h-24 w-24">
              {student.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={student.photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <AvatarFallback className="text-2xl">
                  {getInitials(`${student.firstName} ${student.lastName}`)}
                </AvatarFallback>
              )}
            </Avatar>
            <h2 className="mt-4 font-heading text-xl font-bold">
              {student.firstName} {student.lastName}
            </h2>
            <StatusPill status={student.status} className="mt-2" />
            {!isBillableStudent(student) && (
              <p className="mt-2 rounded-lg bg-soft-red/50 px-3 py-2 text-left text-xs text-danger">
                Not billable — withdraw / alumni / not enrolled.
              </p>
            )}
            <div className="mt-4 flex w-full flex-col gap-2">
              <ViewIdCardButton
                kind="student"
                personId={student.id}
                label="View / Print ID Card"
                className="w-full"
                canIssue={student.status === "active" || student.status === "pending_first_payment"}
              />
              <GenerateLetterButton
                audience="student"
                subjectId={student.id}
                kind="enrollment_letter"
                label="Enrollment letter"
                className="w-full"
              />
              <GenerateLetterButton
                audience="student"
                subjectId={student.id}
                kind="leaving_certificate"
                label="Leaving / clearance"
                className="w-full"
              />
            </div>
            {!apiBacked && <StudentLifecycleActions student={student} onUpdated={setStudent} />}
            <dl className="mt-4 w-full space-y-2 text-left text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">G.R. Number</dt>
                <dd className="text-right font-semibold">{student.grNumber ?? "—"}</dd>
              </div>
              {student.previousGrNumber && (
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Previous G.R.</dt>
                  <dd className="text-right text-muted">{student.previousGrNumber}</dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Branch</dt>
                <dd className="text-right">
                  {branch?.name?.replace(" Campus", "") ?? branchLabel(apiBranches, student.branchId)}
                </dd>
              </div>
              {prevBranch && (
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Previous branch</dt>
                  <dd className="text-right text-muted">{prevBranch.name.replace(" Campus", "")}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Age</dt>
                <dd>{student.dob ? `${calculateAge(student.dob)} years` : "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Class</dt>
                <dd>{student.className}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Blood Group</dt>
                <dd>{student.bloodGroup}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Timing</dt>
                <dd className="text-right">
                  {student.timing
                    ? `${TIMING_SLOT_LABEL[student.timing.slot]} · ${timingRange(student.timing)}`
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Enrolled</dt>
                <dd>{student.enrollmentDate ? formatDate(student.enrollmentDate) : "—"}</dd>
              </div>
              {student.leaveDate && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Left</dt>
                  <dd>{formatDate(student.leaveDate)}</dd>
                </div>
              )}
              {student.rejoinDate && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Rejoined</dt>
                  <dd>{formatDate(student.rejoinDate)}</dd>
                </div>
              )}
              {student.feePlan && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Fee Plan</dt>
                  <dd>{student.feePlan}</dd>
                </div>
              )}
            </dl>
            {mandatoryForms.length > 0 && (
              <div className="mt-4 w-full text-left">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Mandatory forms
                </p>
                <ul className="mt-1.5 space-y-1">
                  {mandatoryForms.map((f) => (
                    <li key={f.id} className="flex items-center justify-between text-xs">
                      <span>{MANDATORY_FORM_LABELS[f.kind]}</span>
                      <span
                        className={
                          f.status === "submitted"
                            ? "font-semibold text-success"
                            : "font-semibold text-amber-600"
                        }
                      >
                        {f.status === "submitted" ? "Submitted" : "Pending"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex-1">
          <Tabs defaultValue={extraTabs[0]?.value ?? "overview"}>
            <TabsList className="flex h-auto flex-wrap">
              {extraTabs.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                </TabsTrigger>
              ))}
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="induction">Induction</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="learning">Learning & development</TabsTrigger>
              <TabsTrigger value="comms">Parent communication</TabsTrigger>
              {!apiBacked && <TabsTrigger value="billing">Billing extras</TabsTrigger>}
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="therapy">Therapy</TabsTrigger>
              <TabsTrigger value="medical">Medical</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            {extraTabs.map((t) => (
              <TabsContent key={t.value} value={t.value} className="mt-4">
                {t.content}
              </TabsContent>
            ))}

            <TabsContent value="overview" className="mt-4 space-y-4">
              <Card>
                <CardHeader><CardTitle>Parents / Guardians</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {parents.map((p) => (
                    <div key={p.id} className="flex justify-between gap-3 text-sm">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-gray-500 capitalize">{p.relation}</p>
                        {p.cnic && <p className="mt-1 text-xs text-muted">CNIC · {p.cnic}</p>}
                      </div>
                      <div className="text-right text-gray-600">
                        <p>{p.phone}</p>
                        <p>{p.email}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Siblings in SDLC</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted">
                  {(student.siblingStudentIds?.length ?? 0) === 0 ? (
                    <p>No linked siblings (current or alumni).</p>
                  ) : (
                    <ul className="space-y-1">
                      {student.siblingStudentIds!.map((id) => (
                        <li key={id}>
                          <a href={`/students/${id}`} className="font-semibold text-brand-600">
                            Sibling · {id}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="induction" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Induction checklist</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {(student.inductionChecklist ?? [
                    { id: "d1", label: "Documents collected", done: false },
                    { id: "d2", label: "Medical form signed", done: false },
                    { id: "d3", label: "Authorized pickup list", done: false },
                    { id: "d4", label: "Parent portal orientation", done: false },
                    { id: "d5", label: "Classroom visit / settling", done: false },
                  ]).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-[#F1F3F5] px-3 py-2.5 text-sm"
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className={item.done ? "text-xs font-bold text-success" : "text-xs text-muted"}>
                        {item.done ? "Done" : "Pending"}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Services</CardTitle></CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2">
                  {[
                    ["Meal plan", student.services?.mealPlan],
                    ["Nazra", student.services?.nazra],
                    ["Learning support", student.services?.learningSupport],
                    ["Saturday service", student.services?.saturdayService],
                  ].map(([label, on]) => (
                    <div
                      key={String(label)}
                      className="flex items-center justify-between rounded-xl bg-bg px-3 py-2.5 text-sm"
                    >
                      <span className="font-medium">{label}</span>
                      <span className={on ? "text-xs font-bold text-success" : "text-xs text-muted"}>
                        {on ? "Active" : "Off"}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="learning" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Learning & development progress</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted">
                    Linked to Academics progress / Montessori observations. Open Academics to publish updates for parents.
                  </p>
                  <a href="/academics" className="inline-block text-xs font-semibold text-brand-600">
                    Open Academics →
                  </a>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comms" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Parent communication history</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="rounded-xl bg-bg px-3 py-2.5">
                    <p className="font-medium">Story time update</p>
                    <p className="text-[11px] text-muted">Messages · yesterday</p>
                  </div>
                  <div className="rounded-xl bg-bg px-3 py-2.5">
                    <p className="font-medium">Fee reminder</p>
                    <p className="text-[11px] text-muted">Push · 3 days ago</p>
                  </div>
                  <a href="/communications" className="inline-block text-xs font-semibold text-brand-600">
                    Open Communications →
                  </a>
                </CardContent>
              </Card>
            </TabsContent>

            {!apiBacked && (
              <TabsContent value="billing" className="mt-4">
                <StudentExtrasPanel student={student} />
              </TabsContent>
            )}

            <TabsContent value="attendance" className="mt-4">
              <AttendanceHeatmap records={attendance} />
            </TabsContent>

            <TabsContent value="therapy" className="mt-4">
              <StudentTherapyPanel
                studentId={student.id}
                studentName={`${student.firstName} ${student.lastName}`}
                sessions={therapySessions}
              />
            </TabsContent>

            <TabsContent value="medical" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Health &amp; Safety records</CardTitle>
                  <a href="/health" className="text-xs font-semibold text-brand-600">
                    Open Health &amp; Safety →
                  </a>
                </CardHeader>
                <CardContent>
                  <HealthRecordList
                    records={healthRecords}
                    emptyText="No hygiene checks, vaccinations or medical records yet."
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Medical Incidents</CardTitle></CardHeader>
                <CardContent>
                  {medicalIncidents.length === 0 ? (
                    <p className="text-sm text-gray-500">No incidents recorded.</p>
                  ) : (
                    <ul className="space-y-3">
                      {medicalIncidents.map((m) => (
                        <li key={m.id} className="rounded-lg border p-3 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{formatDate(m.date)}</span>
                            <span className="capitalize text-gray-500">{m.severity}</span>
                          </div>
                          <p className="mt-1 text-gray-600">{m.description}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Staff Notes</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {notes.map((n) => (
                      <li key={n.id} className="rounded-lg bg-gray-50 p-3 text-sm">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{n.author}</span>
                          <span>{formatDate(n.createdAt)}</span>
                        </div>
                        <p className="mt-1">{n.content}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
