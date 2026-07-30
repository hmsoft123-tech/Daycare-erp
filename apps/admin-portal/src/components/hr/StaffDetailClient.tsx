"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusPill } from "@/components/billing/StatusPill";
import { ViewIdCardButton } from "@/components/id-cards/ViewIdCardButton";
import { EmployeeFilePanel } from "@/components/hr/employee-file/EmployeeFilePanel";
import { StaffSalaryPanel } from "@/components/hr/StaffSalaryPanel";
import { isPayableStaff } from "@/lib/eligibility";
import { ensureSalary, netMonthlyPay } from "@/lib/salary-determination";
import { branches } from "@/data/branches";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import type { Staff } from "@/types";

const roleLabels = {
  admin: "Administrator",
  teacher: "Teacher",
  therapist: "Therapist",
  accountant: "Accountant",
  support: "Support Staff",
  executive: "Executive",
} as const;

export function StaffDetailClient({ member }: { member: Staff }) {
  const branch = branches.find((b) => b.id === member.branchId);
  const salary = ensureSalary(member);
  const net = netMonthlyPay(salary);

  return (
    <div className="space-y-6">
      <Card className="max-w-3xl">
        <CardContent className="flex gap-6 p-6">
          <Avatar className="h-20 w-20">
            {member.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback className="text-xl">{getInitials(member.name)}</AvatarFallback>
            )}
          </Avatar>
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">{roleLabels[member.role]}</Badge>
              <StatusPill status={member.status} />
            </div>
            {!isPayableStaff(member) && (
              <p className="rounded-lg bg-soft-red/60 px-3 py-2 text-xs text-danger">
                Not included in payroll or new HR financial entries.
              </p>
            )}
            <ViewIdCardButton
              kind="staff"
              personId={member.id}
              label="View / Print ID Card"
              canIssue={isPayableStaff(member)}
            />
            <p><span className="text-gray-500">Employee ID:</span> {member.employeeId}</p>
            <p><span className="text-gray-500">Branch:</span> {branch?.name}</p>
            <p><span className="text-gray-500">Joined:</span> {formatDate(member.joinDate)}</p>
            <p>
              <span className="text-gray-500">Est. net pay:</span>{" "}
              <span className="font-semibold text-heading">{formatCurrency(net)}</span>
              <span className="text-muted"> / month</span>
            </p>
            {member.probationEndDate && (
              <p>
                <span className="text-gray-500">Probation ends:</span>{" "}
                {formatDate(member.probationEndDate)}
                {member.probationCompleted ? " · completed" : ""}
              </p>
            )}
            {member.endDate && (
              <p><span className="text-gray-500">Ended:</span> {formatDate(member.endDate)}</p>
            )}
            <p><span className="text-gray-500">Phone:</span> {member.phone}</p>
            <p><span className="text-gray-500">Email:</span> {member.email}</p>
            {member.specializations && (
              <p><span className="text-gray-500">Specializations:</span> {member.specializations.join(", ")}</p>
            )}
            <Button variant="outline" asChild>
              <Link href="/hr/staff">← Back to directory</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="salary" className="max-w-4xl">
        <TabsList>
          <TabsTrigger value="salary">Salary determination</TabsTrigger>
          <TabsTrigger value="file">Employee file</TabsTrigger>
        </TabsList>
        <TabsContent value="salary" className="mt-4">
          <StaffSalaryPanel member={member} />
        </TabsContent>
        <TabsContent value="file" className="mt-4">
          <EmployeeFilePanel member={member} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
