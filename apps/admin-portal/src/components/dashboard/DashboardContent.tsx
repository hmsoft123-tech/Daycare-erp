"use client";

import { Users, Receipt, ClipboardList, CalendarCheck } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { EnrollmentFeed } from "@/components/dashboard/EnrollmentFeed";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { formatCurrency } from "@/lib/utils";
import type { RevenueDataPoint, EnrollmentFeedItem, Student, AdmissionCard, Invoice } from "@/types";
import { useMemo } from "react";

interface DashboardContentProps {
  kpis: {
    totalStudents: number;
    monthlyRevenue: number;
    pendingAdmissions: number;
    attendanceRate: number;
  };
  revenue: RevenueDataPoint[];
  enrollments: EnrollmentFeedItem[];
  students: Student[];
  admissions: AdmissionCard[];
  invoices: Invoice[];
}

export function DashboardContent({ kpis, revenue, enrollments, students, admissions, invoices }: DashboardContentProps) {
  const branchId = useBranchFilter();

  const branchKpis = useMemo(() => {
    if (!branchId) return kpis;
    const branchStudents = students.filter((s) => s.branchId === branchId && s.status === "active");
    const branchInvoices = invoices.filter((i) => i.branchId === branchId);
    const branchAdmissions = admissions.filter(
      (a) => a.branchId === branchId && a.stage !== "paid"
    );
    return {
      totalStudents: branchStudents.length,
      monthlyRevenue: branchInvoices.reduce((sum, i) => sum + i.amount, 0),
      pendingAdmissions: branchAdmissions.length,
      attendanceRate: kpis.attendanceRate,
    };
  }, [branchId, kpis, students, admissions, invoices]);

  const filteredEnrollments = useMemo(
    () => (branchId ? enrollments.filter((e) => e.branchId === branchId) : enrollments),
    [enrollments, branchId]
  );

  return (
    <div className="space-y-6">
      <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Active Students"
          value={branchKpis.totalStudents}
          icon={Users}
          tone="green"
          subtitle={branchId ? "This branch" : "All branches"}
          trend={{ value: 5, label: "vs last month" }}
        />
        <KPICard
          title="Monthly Revenue"
          value={formatCurrency(branchKpis.monthlyRevenue)}
          icon={Receipt}
          tone="blue"
          subtitle="Across selected context"
          trend={{ value: 8, label: "vs last month" }}
        />
        <KPICard
          title="Pending Admissions"
          value={branchKpis.pendingAdmissions}
          icon={ClipboardList}
          tone="yellow"
          subtitle="Inquiries in pipeline"
          trend={{ value: 3, label: "vs last week" }}
        />
        <KPICard
          title="Attendance Rate"
          value={`${branchKpis.attendanceRate}%`}
          icon={CalendarCheck}
          tone="cyan"
          subtitle="Marked present today"
          trend={{ value: 2, label: "vs last week" }}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={revenue} />
        </div>
        <EnrollmentFeed items={filteredEnrollments} />
      </div>
    </div>
  );
}
