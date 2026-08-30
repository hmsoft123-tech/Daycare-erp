"use client";

import Link from "next/link";
import {
  Users,
  Receipt,
  ClipboardList,
  CalendarCheck,
  AlertTriangle,
  Package,
  Baby,
  UserCog,
  Wrench,
  Cake,
  MessageSquare,
  Lock,
} from "lucide-react";
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

export function DashboardContent({
  kpis,
  revenue,
  enrollments,
  students,
  admissions,
  invoices,
}: DashboardContentProps) {
  const branchId = useBranchFilter();

  const branchKpis = useMemo(() => {
    if (!branchId) return kpis;
    const branchStudents = students.filter((s) => s.branchId === branchId && s.status === "active");
    const branchInvoices = invoices.filter((i) => i.branchId === branchId);
    const branchAdmissions = admissions.filter((a) => a.branchId === branchId && a.stage !== "paid");
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

  const onSite = Math.max(1, Math.round(branchKpis.totalStudents * (branchKpis.attendanceRate / 100)));
  const overdueFees = invoices.filter((i) => i.status === "overdue" || i.status === "pending").length;
  const staffPresent = Math.max(4, Math.round(onSite / 6));

  const roomRatios = useMemo(() => {
    const scoped = branchId ? students.filter((s) => s.branchId === branchId) : students;
    const active = scoped.filter((s) => s.status === "active");
    const byRoom = new Map<string, { students: number; staff: number }>();
    for (const s of active) {
      const room = s.className || "Unassigned";
      const cur = byRoom.get(room) ?? { students: 0, staff: 0 };
      cur.students += 1;
      byRoom.set(room, cur);
    }
    const rows = Array.from(byRoom.entries()).map(([room, v]) => ({
      room,
      studentsIn: Math.round(v.students * (branchKpis.attendanceRate / 100)),
      staffIn: Math.max(1, Math.round((v.students * (branchKpis.attendanceRate / 100)) / 6)),
    }));
    const all = {
      room: "All Rooms",
      studentsIn: rows.reduce((n, r) => n + r.studentsIn, 0),
      staffIn: rows.reduce((n, r) => n + r.staffIn, 0),
    };
    return [all, ...rows];
  }, [students, branchId, branchKpis.attendanceRate]);

  const birthdays = useMemo(() => {
    const scoped = (branchId ? students.filter((s) => s.branchId === branchId) : students)
      .filter((s) => s.dob)
      .map((s) => {
        const d = new Date(s.dob);
        const now = new Date();
        const age = Math.max(0, now.getFullYear() - d.getFullYear());
        const label = `${d.getMonth() + 1}/${d.getDate()}`;
        return {
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          ageLabel: `${age} years old`,
          dateLabel: label,
          photo: s.photo,
        };
      })
      .slice(0, 4);
    return scoped;
  }, [students, branchId]);

  const opsCards = [
    {
      title: "Children on site",
      value: String(onSite),
      hint: `of ${branchKpis.totalStudents} active`,
      icon: Baby,
      href: "/attendance",
    },
    {
      title: "Staff present",
      value: String(staffPresent),
      hint: "1 substitute available",
      icon: UserCog,
      href: "/hr/staff",
    },
    {
      title: "Ratio alert",
      value: "OK",
      hint: "Infant · 1:4 within limit",
      icon: Users,
      href: "/classrooms",
    },
    {
      title: "Outstanding fees",
      value: String(overdueFees),
      hint: "Invoices pending / overdue",
      icon: Receipt,
      href: "/billing",
    },
    {
      title: "Fee lock queue",
      value: "2",
      hint: "HO approvals waiting",
      icon: Lock,
      href: "/billing/fee-locks",
    },
    {
      title: "Open incidents",
      value: "1",
      hint: "Medication note due",
      icon: AlertTriangle,
      href: "/incidents",
    },
    {
      title: "Low stock",
      value: "3",
      hint: "Branch reorder alerts",
      icon: Package,
      href: "/inventory/stock",
    },
    {
      title: "Maintenance",
      value: "1",
      hint: "AC service reminder · Phase 2",
      icon: Wrench,
      href: "/workflows",
    },
  ];

  const planner = [
    { when: "Today 10:00", what: "Tour — Siddiqui family", href: "/admissions" },
    { when: "Today 14:30", what: "Staff interview — hiring", href: "/hr/inquiries" },
    { when: "Tomorrow", what: "Birthday · Hamdan Khan", href: "/students" },
    { when: "Fri", what: "PTM block · Infant Room A", href: "/communications" },
  ];

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

      <div>
        <div className="mb-3 flex items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-heading">Live operational snapshot</h2>
            <p className="text-xs text-muted">SDLC overview widgets · demo figures</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {opsCards.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className="rounded-2xl border border-[#F1F3F5] bg-white p-4 transition hover:border-brand-200"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-muted">{c.title}</p>
                <c.icon className="h-4 w-4 text-brand-500" />
              </div>
              <p className="mt-2 text-xl font-bold text-heading">{c.value}</p>
              <p className="mt-0.5 text-[11px] text-muted">{c.hint}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={revenue} />
        </div>
        <EnrollmentFeed items={filteredEnrollments} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#F1F3F5] bg-white p-4 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <Link href="/classrooms" className="text-sm font-semibold text-heading hover:text-brand-600">
                Current room ratios →
              </Link>
              <p className="text-[11px] text-muted">
                as of{" "}
                {new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} ·{" "}
                {new Date().toLocaleDateString()}
              </p>
            </div>
            <Link
              href="/attendance"
              className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700"
            >
              Launch check-in
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-[#F1F3F5]">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">Room</th>
                  <th className="px-3 py-2 font-semibold">Students in</th>
                  <th className="px-3 py-2 font-semibold">Staff in</th>
                </tr>
              </thead>
              <tbody>
                {roomRatios.map((r) => (
                  <tr key={r.room} className="border-t border-[#F1F3F5]">
                    <td className="px-3 py-2.5 font-medium text-heading">{r.room}</td>
                    <td className="px-3 py-2.5 text-muted">{r.studentsIn}</td>
                    <td className="px-3 py-2.5 text-muted">{r.staffIn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-[#F1F3F5] bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Cake className="h-4 w-4 text-brand-500" />
            <h3 className="text-sm font-semibold">Upcoming birthdays</h3>
          </div>
          <ul className="space-y-2">
            {birthdays.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/students/${b.id}`}
                  className="flex items-center gap-3 rounded-xl bg-bg px-3 py-2.5 hover:bg-brand-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
                    {b.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      b.name.slice(0, 2)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-heading">{b.name}</p>
                    <p className="text-[11px] text-muted">{b.ageLabel}</p>
                  </div>
                  <span className="text-xs font-semibold text-muted">{b.dateLabel}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#F1F3F5] bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Cake className="h-4 w-4 text-brand-500" />
            <h3 className="text-sm font-semibold">Admin planner</h3>
          </div>
          <ul className="space-y-2">
            {planner.map((p) => (
              <li key={p.what}>
                <Link
                  href={p.href}
                  className="flex items-center justify-between rounded-xl bg-bg px-3 py-2.5 text-sm hover:bg-brand-50"
                >
                  <span className="font-medium text-heading">{p.what}</span>
                  <span className="text-[11px] text-muted">{p.when}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-[#F1F3F5] bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-brand-500" />
            <h3 className="text-sm font-semibold">Communication log</h3>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="rounded-xl bg-bg px-3 py-2.5">
              <p className="font-medium">Emergency drill notice sent</p>
              <p className="text-[11px] text-muted">In-app · all parents · 08:05</p>
            </li>
            <li className="rounded-xl bg-bg px-3 py-2.5">
              <p className="font-medium">Fee reminder — August</p>
              <p className="text-[11px] text-muted">Push · 42 families · yesterday</p>
            </li>
            <li className="rounded-xl bg-bg px-3 py-2.5">
              <p className="font-medium">PTM slots published</p>
              <p className="text-[11px] text-muted">Messages hub · Infant Room A</p>
            </li>
          </ul>
          <Link href="/communications" className="mt-3 inline-block text-xs font-semibold text-brand-600">
            Open Communications →
          </Link>
        </div>
      </div>
    </div>
  );
}
