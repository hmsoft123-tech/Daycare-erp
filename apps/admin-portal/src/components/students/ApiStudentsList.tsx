"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VirtualStudentTable } from "@/components/students/VirtualStudentTable";
import { useApiClient } from "@/lib/api";
import { apiErrorMessage } from "@/lib/admissions-api";
import { todayIso } from "@/lib/fee-challan";
import { useBranches, useStudentBranchFilters } from "@/lib/hooks/use-branches";
import { parentsFromApi, studentFromApi, type ApiStudent } from "@/lib/students-api";
import { useTenantStore } from "@/lib/tenant-store";

/** All Students from `GET /students` (the API lists active students), shown in the register table. */
export function ApiStudentsList() {
  const api = useApiClient();
  const tenantId = useTenantStore((s) => s.tenantId) ?? "";
  const { branches } = useBranches();

  const branchValues = useStudentBranchFilters();
  const { data, isPending, isError, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["students", tenantId, branchValues?.join(",") ?? ""],
    queryFn: async () => {
      const lists = await Promise.all(
        (branchValues ?? [undefined]).map((b) =>
          api.get<ApiStudent[]>(b ? `/students?branchId=${encodeURIComponent(b)}` : "/students")
        )
      );
      return [...new Map(lists.flat().map((s) => [s.id, s])).values()];
    },
    enabled: !!tenantId,
  });

  const { students, parents } = useMemo(
    () => ({
      // Website enrollments carry the branch's numeric id; the table and filter use its code.
      students: (data ?? []).map(studentFromApi).map((s) => ({
        ...s,
        branchId: branches.find((b) => b.id === s.branchId)?.code ?? s.branchId,
      })),
      parents: (data ?? []).flatMap(parentsFromApi),
    }),
    [data, branches]
  );
  const branchOptions = useMemo(() => {
    const known = branches.map((b) => ({ value: b.code, label: b.name }));
    // Students in a branch the user's list does not include still get a filter entry.
    const extra = [...new Set(students.map((s) => s.branchId).filter((c) => c && !known.some((k) => k.value === c)))];
    return [...known, ...extra.map((c) => ({ value: c, label: c }))];
  }, [branches, students]);

  if (!tenantId || isPending) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading students…
      </div>
    );
  }
  if (isError) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center shadow-card">
        <p className="text-sm font-medium text-danger">{apiErrorMessage(error, "Could not load students.")}</p>
        <Button variant="outline" className="mt-4" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted">
          No enrolled students yet. Students appear here once an admission is paid or a walk-in enrollment is completed.
        </CardContent>
      </Card>
    );
  }
  return (
    <VirtualStudentTable
      // Remount on refetch: the table keeps its own copy of the rows.
      key={dataUpdatedAt}
      students={students}
      parents={parents}
      attendance={{}}
      attendanceDate={todayIso()}
      branchOptions={branchOptions}
      readOnly
    />
  );
}
