"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { StudentProfile } from "@/components/students/StudentProfile";
import { StudentSubscriptionsPanel } from "@/components/students/StudentSubscriptionsPanel";
import { StudentBalancePanel } from "@/components/students/StudentBalancePanel";
import { StudentTransferPanel } from "@/components/students/StudentTransferPanel";
import { useApiClient } from "@/lib/api";
import { apiErrorMessage } from "@/lib/admissions-api";
import { parentsFromApi, studentFromApi, type ApiClassroom, type ApiStudent } from "@/lib/students-api";

/** Student profile from `GET /students/{id}`, with the API-backed fees, balance and transfer tabs. */
export function ApiStudentProfile({ id }: { id: string }) {
  const api = useApiClient();
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["student", id],
    queryFn: () => api.get<ApiStudent>(`/students/${encodeURIComponent(id)}`),
  });

  const classroomId = data?.classroomId;
  const { data: classroom } = useQuery({
    queryKey: ["classroom", classroomId],
    queryFn: () => api.get<ApiClassroom>(`/hierarchy/classrooms/${encodeURIComponent(classroomId ?? "")}`),
    enabled: !!classroomId,
    retry: 0,
  });

  const mapped = useMemo(
    () => (data ? { student: studentFromApi(data), parents: parentsFromApi(data) } : null),
    [data]
  );

  const back = (
    <Button variant="outline" asChild>
      <Link href="/students">← All Students</Link>
    </Button>
  );

  if (isPending || isError || !mapped || !data) {
    return (
      <>
        <PageHeader title="Student">{back}</PageHeader>
        {isPending ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading student…
          </div>
        ) : (
          <div className="rounded-2xl bg-surface p-8 text-center shadow-card">
            <p className="text-sm font-medium text-danger">
              {(error as { status?: number } | null)?.status === 404
                ? "This student was not found."
                : apiErrorMessage(error, "Could not load the student.")}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        )}
      </>
    );
  }

  const { student, parents } = mapped;
  const name = `${student.firstName} ${student.lastName}`.trim();
  const extraTabs = [
    {
      value: "subscriptions",
      label: "Services",
      content: <StudentSubscriptionsPanel studentId={id} branchCode={student.branchId} program={data.program ?? ""} />,
    },
    { value: "balance", label: "Balance", content: <StudentBalancePanel studentId={id} /> },
    {
      value: "transfer",
      label: "Transfer",
      content: (
        <StudentTransferPanel
          studentId={id}
          studentName={name}
          branchCode={student.branchId}
          currentClassroomId={data.classroomId ?? undefined}
          currentClassroomName={classroom?.name ?? undefined}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader title={name} subtitle={[student.className, data.studentCode].filter(Boolean).join(" · ")}>
        {back}
      </PageHeader>
      <StudentProfile
        student={student}
        parents={parents}
        notes={[]}
        medicalIncidents={[]}
        attendance={[]}
        classroomName={classroom?.name ?? data.classroomId ?? undefined}
        apiBacked
        extraTabs={extraTabs}
      />
    </>
  );
}
