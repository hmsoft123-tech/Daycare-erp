"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AllergyBanner } from "./AllergyBanner";
import { AttendanceHeatmap } from "./AttendanceHeatmap";
import { StatusPill } from "@/components/billing/StatusPill";
import { calculateAge, formatDate, getInitials } from "@/lib/utils";
import type { Student, Parent, StudentNote, MedicalIncident, AttendanceRecord } from "@/types";

interface StudentProfileProps {
  student: Student;
  parents: Parent[];
  notes: StudentNote[];
  medicalIncidents: MedicalIncident[];
  attendance: AttendanceRecord[];
}

export function StudentProfile({ student, parents, notes, medicalIncidents, attendance }: StudentProfileProps) {
  return (
    <div className="space-y-6">
      <AllergyBanner allergies={student.allergies} />

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
            <dl className="mt-4 w-full space-y-2 text-left text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Age</dt>
                <dd>{calculateAge(student.dob)} years</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Class</dt>
                <dd>{student.className}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Blood Group</dt>
                <dd>{student.bloodGroup}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Enrolled</dt>
                <dd>{formatDate(student.enrollmentDate)}</dd>
              </div>
              {student.feePlan && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Fee Plan</dt>
                  <dd>{student.feePlan}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <div className="flex-1">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="medical">Medical</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <Card>
                <CardHeader><CardTitle>Parents / Guardians</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {parents.map((p) => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-gray-500 capitalize">{p.relation}</p>
                      </div>
                      <div className="text-right text-gray-600">
                        <p>{p.phone}</p>
                        <p>{p.email}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="mt-4">
              <AttendanceHeatmap records={attendance} />
            </TabsContent>

            <TabsContent value="medical" className="mt-4">
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
