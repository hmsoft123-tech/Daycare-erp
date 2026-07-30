"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/billing/StatusPill";
import { EditStaffStatusModal } from "@/components/hr/EditStaffStatusModal";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { isPayableStaff } from "@/lib/eligibility";
import { formatDate, getInitials } from "@/lib/utils";
import type { Staff, StaffStatus } from "@/types";
import { Mail, Phone, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StaffDirectoryProps {
  staff: Staff[];
}

const roleLabels: Record<Staff["role"], string> = {
  admin: "Administrator",
  teacher: "Teacher",
  therapist: "Therapist",
  accountant: "Accountant",
  support: "Support Staff",
  executive: "Executive",
};

export function StaffDirectory({ staff: initial }: StaffDirectoryProps) {
  const branchId = useBranchFilter();
  const [staff, setStaff] = useState(initial);
  const [editing, setEditing] = useState<Staff | null>(null);

  const filtered = branchId ? staff.filter((s) => s.branchId === branchId) : staff;

  const onStatusSave = (id: string, status: StaffStatus, endDate?: string) => {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status,
              endDate: status === "active" ? undefined : endDate ?? s.endDate ?? new Date().toISOString().slice(0, 10),
            }
          : s
      )
    );
  };

  return (
    <>
      <div className="mb-4 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
        Resigned / fired / inactive staff are shown for records but excluded from payroll and new entries.
        Active on payroll:{" "}
        <span className="font-semibold text-heading">{staff.filter(isPayableStaff).length}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((member) => (
          <Card
            key={member.id}
            className={`h-full transition-shadow hover:shadow-md ${!isPayableStaff(member) ? "opacity-75" : ""}`}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  {member.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={member.photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  )}
                </Avatar>
                <div className="min-w-0 flex-1">
                  <Link href={`/hr/staff/${member.id}`} className="font-medium text-brand-900 hover:underline">
                    {member.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge variant="info">{roleLabels[member.role]}</Badge>
                    <StatusPill status={member.status} />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{member.employeeId}</p>
                  <p className="text-xs text-gray-500">Joined {formatDate(member.joinDate)}</p>
                  {member.endDate && !isPayableStaff(member) && (
                    <p className="text-xs text-danger">Ended {formatDate(member.endDate)}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-1 text-xs text-gray-600">
                <p className="flex items-center gap-2"><Phone className="h-3 w-3" />{member.phone}</p>
                <p className="flex items-center gap-2"><Mail className="h-3 w-3" />{member.email}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-4 w-full"
                onClick={() => setEditing(member)}
              >
                <UserCog className="h-3.5 w-3.5" />
                Employment status
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <EditStaffStatusModal
        open={!!editing}
        staff={editing}
        onClose={() => setEditing(null)}
        onSave={onStatusSave}
      />
    </>
  );
}
