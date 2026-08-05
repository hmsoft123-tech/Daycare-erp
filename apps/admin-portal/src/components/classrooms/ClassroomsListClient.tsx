"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { branches } from "@/data/branches";
import type { ClassRoom, Staff, Student } from "@/types";
import { School, Users, UserRound } from "lucide-react";

type Props = {
  classrooms: ClassRoom[];
  students: Student[];
  staff: Staff[];
};

export function ClassroomsListClient({ classrooms, students, staff }: Props) {
  const branchId = useBranchFilter();
  const filtered = useMemo(
    () => (branchId ? classrooms.filter((c) => c.branchId === branchId) : classrooms),
    [classrooms, branchId]
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Branch classrooms with assigned teachers, student rosters, and activity logs shared to the
        parent portal.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((room) => {
          const teacher = staff.find((s) => s.id === room.teacherId);
          const roster = students.filter((s) => s.classId === room.id && s.status === "active");
          const branch = branches.find((b) => b.id === room.branchId);
          return (
            <Link key={room.id} href={`/classrooms/${room.id}`}>
              <Card className="h-full transition hover:shadow-card-hover">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
                      <School className="h-5 w-5 text-brand-600" />
                    </div>
                    <Badge variant="secondary">{branch?.name.replace(" Campus", "") ?? room.branchId}</Badge>
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-bold text-heading">{room.name}</h3>
                    {room.ageBand && <p className="text-xs text-muted">{room.ageBand}</p>}
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <p className="flex items-center gap-2 text-heading">
                      <UserRound className="h-3.5 w-3.5 text-muted" />
                      {teacher?.name ?? "Unassigned teacher"}
                    </p>
                    <p className="flex items-center gap-2 text-muted">
                      <Users className="h-3.5 w-3.5" />
                      {roster.length}
                      {room.capacity != null ? ` / ${room.capacity}` : ""} students
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-[#DFE3E8] px-4 py-10 text-center text-sm text-muted">
          No classrooms for this branch.
        </p>
      )}
    </div>
  );
}
