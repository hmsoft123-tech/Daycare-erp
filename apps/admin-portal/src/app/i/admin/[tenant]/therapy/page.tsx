import { PageHeader } from "@/components/layout/PageHeader";
import { TherapyLogForm } from "@/components/hr/TherapyLogForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTherapySessions, getStudents } from "@/lib/mock-service";
import { formatDate } from "@/lib/utils";
import { TherapyPageClient } from "./TherapyPageClient";

export default async function TherapyPage() {
  const [sessions, students] = await Promise.all([getTherapySessions(), getStudents()]);

  return (
    <>
      <PageHeader title="Therapy Logs" subtitle="Document SOAP notes for therapy sessions" />
      <div className="grid gap-6 lg:grid-cols-2">
        <TherapyPageClient students={students.filter((s) => s.status === "active")} />
        <Card>
          <CardHeader><CardTitle>Recent Sessions</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {sessions.map((s) => {
                const student = students.find((st) => st.id === s.studentId);
                return (
                  <li key={s.id} className="rounded-lg border p-4 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{student ? `${student.firstName} ${student.lastName}` : s.studentId}</span>
                      <span className="text-gray-500">{formatDate(s.date)}</span>
                    </div>
                    <p className="mt-1 text-gray-600">{s.therapistName} · {s.duration} min · {s.types.join(", ")}</p>
                    <p className="mt-2 text-xs text-gray-500">Compliance: {s.complianceScore}/10</p>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
