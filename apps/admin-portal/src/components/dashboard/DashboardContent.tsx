"use client";

import Link from "next/link";
import {
  Users,
  ClipboardList,
  CalendarCheck,
  AlertTriangle,
  Package,
  Baby,
  UserCog,
  Wrench,
  Cake,
  MessageSquare,
  Utensils,
  HeartPulse,
  BarChart3,
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

/** FE review — default ratio targets by room name keywords */
function ratioTarget(room: string) {
  const n = room.toLowerCase();
  if (n.includes("infant")) return "4:1";
  if (n.includes("toddler")) return "6:1";
  if (n.includes("pre") || n.includes("play")) return "8:1";
  if (n.includes("nursery") || n.includes("kg") || n.includes("kinder")) return "8:1";
  if (n.includes("after")) return "10:1";
  return "8:1";
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
  const staffOnSite = Math.max(4, Math.round(onSite / 6));
  const dailyCollection = invoices
    .filter((i) => i.status === "paid")
    .slice(0, 8)
    .reduce((n, i) => n + i.amount, 0);

  const roomRatios = useMemo(() => {
    const scoped = branchId ? students.filter((s) => s.branchId === branchId) : students;
    const active = scoped.filter((s) => s.status === "active");
    const byRoom = new Map<string, number>();
    for (const s of active) {
      const room = s.className || "Unassigned";
      byRoom.set(room, (byRoom.get(room) ?? 0) + 1);
    }
    return Array.from(byRoom.entries()).map(([room, count]) => {
      const inNow = Math.round(count * (branchKpis.attendanceRate / 100));
      const target = ratioTarget(room);
      const staffNeed = Math.max(1, Math.ceil(inNow / Number(target.split(":")[0] || 8)));
      return { room, studentsIn: inNow, staffIn: staffNeed, target };
    });
  }, [students, branchId, branchKpis.attendanceRate]);

  const childBirthdays = useMemo(() => {
    return (branchId ? students.filter((s) => s.branchId === branchId) : students)
      .filter((s) => s.dob)
      .map((s) => {
        const d = new Date(s.dob);
        const age = Math.max(0, new Date().getFullYear() - d.getFullYear());
        return {
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          ageLabel: `${age} yrs`,
          dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
          photo: s.photo,
          href: `/students/${s.id}`,
        };
      })
      .slice(0, 4);
  }, [students, branchId]);

  const staffBirthdays = [
    { id: "st1", name: "Fatima Noor", ageLabel: "Teacher", dateLabel: "9/8", href: "/hr/staff" },
    { id: "st2", name: "Nadia Farooq", ageLabel: "Teacher", dateLabel: "9/12", href: "/hr/staff" },
  ];

  /** Live ops ≈ Daily report / communication (FE review) */
  const dailyOps = [
    { title: "Children on site", value: String(onSite), hint: `of ${branchKpis.totalStudents} active`, icon: Baby, href: "/attendance" },
    { title: "Staff on site", value: String(staffOnSite), hint: "1 substitute available", icon: UserCog, href: "/hr/staff" },
    { title: "Staff : child ratios", value: "Per class", hint: "See ratio table below", icon: Users, href: "/classrooms" },
    { title: "Daily collection", value: formatCurrency(dailyCollection), hint: "Paid invoices (demo)", icon: BarChart3, href: "/billing" },
    { title: "Open incidents", value: "1", hint: "Issues / medication follow-up", icon: AlertTriangle, href: "/incidents" },
    { title: "Low stock", value: "3", hint: "Branch reorder alerts", icon: Package, href: "/inventory/stock" },
    { title: "Maintenance", value: "1", hint: "Service reminder", icon: Wrench, href: "/workflows" },
    { title: "Today's menu", value: "Daal · rice · fruit", hint: "Kitchen plan · demo", icon: Utensils, href: "/settings" },
    { title: "Medication / treatment", value: "1 dose", hint: "Logged today · demo", icon: HeartPulse, href: "/therapy" },
  ];

  const plannerDays = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const hasAdmin = i === 0 || i === 2 || i === 5;
      const hasAnnual = i === 3 || i === 10;
      return { key, label: d.getDate(), dow: d.toLocaleDateString(undefined, { weekday: "short" }), hasAdmin, hasAnnual };
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Non-finance KPIs first */}
      <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="Active Students"
          value={branchKpis.totalStudents}
          icon={Users}
          tone="green"
          subtitle={branchId ? "This branch" : "All branches"}
          trend={{ value: 5, label: "vs last month" }}
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

      {/* Branch evaluation + monthly summary shells (formats TBD) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#F1F3F5] bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Branch evaluation</h2>
            <span className="rounded-full bg-soft-green px-2.5 py-1 text-[11px] font-bold text-success">
              Satisfactory
            </span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Full report format will be shared · header shows Satisfactory / Unsatisfactory.
          </p>
          <Link href="/reports" className="mt-3 inline-block text-xs font-semibold text-brand-600">
            Open analytics →
          </Link>
        </div>
        <div className="rounded-2xl border border-[#F1F3F5] bg-white p-4">
          <h2 className="text-sm font-semibold">Branch summary — last month</h2>
          <p className="mt-2 text-xs text-muted">
            Monthly branch summary format will be shared. Placeholder for last-month KPIs and notes.
          </p>
          <Link href="/reports" className="mt-3 inline-block text-xs font-semibold text-brand-600">
            View reports →
          </Link>
        </div>
      </div>

      {/* Live operational snapshot = daily report / communication */}
      <div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-heading">Live operational snapshot</h2>
            <p className="text-xs text-muted">Daily report / communication log items · FE review</p>
          </div>
          <Link href="/communications" className="text-xs font-semibold text-brand-600">
            Communication log →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dailyOps.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className="rounded-2xl border border-[#F1F3F5] bg-white p-4 transition hover:border-brand-200"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-muted">{c.title}</p>
                <c.icon className="h-4 w-4 text-brand-500" />
              </div>
              <p className="mt-2 text-lg font-bold text-heading">{c.value}</p>
              <p className="mt-0.5 text-[11px] text-muted">{c.hint}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Mini calendar + birthdays */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#F1F3F5] bg-white p-4 lg:col-span-1">
          <h3 className="text-sm font-semibold">Mini calendar</h3>
          <p className="text-[11px] text-muted">Annual planner · Admin planner (formats TBD)</p>
          <div className="mt-3 grid grid-cols-7 gap-1">
            {plannerDays.map((d) => (
              <div
                key={d.key}
                className={`rounded-lg px-1 py-2 text-center text-[10px] ${
                  d.hasAnnual
                    ? "bg-brand-500 text-white"
                    : d.hasAdmin
                      ? "bg-brand-50 text-brand-700"
                      : "bg-bg text-muted"
                }`}
                title={d.hasAnnual ? "Annual planner" : d.hasAdmin ? "Admin planner" : undefined}
              >
                <div className="font-semibold">{d.label}</div>
                <div className="opacity-70">{d.dow.slice(0, 2)}</div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-brand-500" /> Annual{" "}
            <span className="ml-2 mr-2 inline-block h-2 w-2 rounded-full bg-brand-200" /> Admin
          </p>
        </div>

        <div className="rounded-2xl border border-[#F1F3F5] bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Cake className="h-4 w-4 text-brand-500" />
            <h3 className="text-sm font-semibold">Child birthdays</h3>
          </div>
          <ul className="space-y-2">
            {childBirthdays.map((b) => (
              <li key={b.id}>
                <Link href={b.href} className="flex items-center justify-between rounded-xl bg-bg px-3 py-2 text-sm hover:bg-brand-50">
                  <span className="font-medium">{b.name}</span>
                  <span className="text-[11px] text-muted">
                    {b.ageLabel} · {b.dateLabel}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[#F1F3F5] bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Cake className="h-4 w-4 text-brand-500" />
            <h3 className="text-sm font-semibold">Staff birthdays</h3>
          </div>
          <ul className="space-y-2">
            {staffBirthdays.map((b) => (
              <li key={b.id}>
                <Link href={b.href} className="flex items-center justify-between rounded-xl bg-bg px-3 py-2 text-sm hover:bg-brand-50">
                  <span className="font-medium">{b.name}</span>
                  <span className="text-[11px] text-muted">
                    {b.ageLabel} · {b.dateLabel}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Room ratios */}
      <div className="rounded-2xl border border-[#F1F3F5] bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <Link href="/classrooms" className="text-sm font-semibold hover:text-brand-600">
              Staff : child ratios by class →
            </Link>
            <p className="text-[11px] text-muted">Infant 4:1 · Toddler 6:1 · Pre/Nursery/KG 8:1 · Afterschool 10:1</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg text-[11px] uppercase text-muted">
              <tr>
                <th className="px-3 py-2">Room</th>
                <th className="px-3 py-2">Students in</th>
                <th className="px-3 py-2">Staff in</th>
                <th className="px-3 py-2">Target ratio</th>
              </tr>
            </thead>
            <tbody>
              {roomRatios.map((r) => (
                <tr key={r.room} className="border-t border-[#F1F3F5]">
                  <td className="px-3 py-2.5 font-medium">{r.room}</td>
                  <td className="px-3 py-2.5 text-muted">{r.studentsIn}</td>
                  <td className="px-3 py-2.5 text-muted">{r.staffIn}</td>
                  <td className="px-3 py-2.5 text-muted">{r.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Communication log */}
      <div className="rounded-2xl border border-[#F1F3F5] bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-brand-500" />
          <h3 className="text-sm font-semibold">Communication log (daily report)</h3>
        </div>
        <p className="mb-3 text-xs text-muted">Detailed daily report format will be shared.</p>
        <ul className="grid gap-2 sm:grid-cols-3 text-sm">
          <li className="rounded-xl bg-bg px-3 py-2.5">
            <p className="font-medium">Emergency drill notice</p>
            <p className="text-[11px] text-muted">In-app · all parents · 08:05</p>
          </li>
          <li className="rounded-xl bg-bg px-3 py-2.5">
            <p className="font-medium">Fee reminder — August</p>
            <p className="text-[11px] text-muted">Push · families · yesterday</p>
          </li>
          <li className="rounded-xl bg-bg px-3 py-2.5">
            <p className="font-medium">PTM slots published</p>
            <p className="text-[11px] text-muted">Messages · Infant Room A</p>
          </li>
        </ul>
      </div>

      {/* Finance at bottom — FE review */}
      <div className="space-y-4 border-t border-[#F1F3F5] pt-6">
        <h2 className="text-sm font-semibold text-heading">Finance</h2>
        <p className="text-xs text-muted">Monthly revenue and financial charts sit below operational widgets.</p>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <RevenueChart data={revenue} />
            <div className="rounded-2xl border border-[#F1F3F5] bg-white px-4 py-3 text-sm">
              <span className="text-muted">Monthly revenue · </span>
              <span className="font-bold text-heading">{formatCurrency(branchKpis.monthlyRevenue)}</span>
              <span className="text-muted"> (under revenue chart)</span>
            </div>
          </div>
          <EnrollmentFeed items={filteredEnrollments} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/billing" className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
            Billing & invoices
          </Link>
          <Link href="/billing/fee-locks" className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
            HO fee / discount approvals
          </Link>
        </div>
      </div>
    </div>
  );
}
