"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { formatDate, getInitials } from "@/lib/utils";
import type { Staff } from "@/types";
import { Mail, Phone } from "lucide-react";

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

export function StaffDirectory({ staff }: StaffDirectoryProps) {
  const branchId = useBranchFilter();
  const filtered = branchId ? staff.filter((s) => s.branchId === branchId) : staff;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((member) => (
        <Link key={member.id} href={`/hr/staff/${member.id}`}>
          <Card className="h-full transition-shadow hover:shadow-md">
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
                  <p className="font-medium text-brand-900">{member.name}</p>
                  <Badge variant="info" className="mt-1">{roleLabels[member.role]}</Badge>
                  <p className="mt-2 text-xs text-gray-500">{member.employeeId}</p>
                  <p className="text-xs text-gray-500">Joined {formatDate(member.joinDate)}</p>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-xs text-gray-600">
                <p className="flex items-center gap-2"><Phone className="h-3 w-3" />{member.phone}</p>
                <p className="flex items-center gap-2"><Mail className="h-3 w-3" />{member.email}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
