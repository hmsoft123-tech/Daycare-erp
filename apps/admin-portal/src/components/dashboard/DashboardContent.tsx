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
import { CategoryNav, SectionCategory } from "@/components/layout/SectionCategory";
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

function ratioTarget(room: string) {
  const n = room.toLowerCase();
  if (n.includes("infant")) return "4:1";
  if (n.includes("toddler")) return "6:1";
  if (n.includes("pre") || n.includes("play")) return "8:1";
  if (n.includes("nursery") || n.includes("kg") || n.includes("kinder")) return "8:1";
  if (n.includes("after")) return "10:1";
  return "8:1";
}

type OpsCard = {
  title: string;
  value: string;
  hint: string;
  icon: typeof Baby;
  href: string;
};

function OpsGrid({ items }: { items: OpsCard[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => (
        <Link
          key={c.title}
          href={c.href}
          className="rounded-xl border border-border bg-bg p-4 transition hover:border-brand-200"
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
  );
}

const NAV = [
  { id: "dash-overview", label: "1. Overview" },
  { id: "dash-branch", label: "2. Branch health" },
  { id: "dash-people", label: "3. People on site" },
  { id: "dash-care", label: "4. Care & safety" },
  { id: "dash-ops", label: "5. Ops alerts" },
  { id: "dash-calendar", label: "6. Calendar" },
  { id: "dash-comms", label: "7. Communication" },
  { id: "dash-finance", label: "8. Finance" },
];

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
          href: `/students/${s.id}`,
        };
      })
      .slice(0, 4);
  }, [students, branchId]);

  const staffBirthdays = [
    { id: "st1", name: "Fatima Noor", ageLabel: "Teacher", dateLabel: "9/8", href: "/hr/staff" },
    { id: "st2", name: "Nadia Farooq", ageLabel: "Teacher", dateLabel: "9/12", href: "/hr/staff" },
  ];

  const peopleOps: OpsCard[] = [
    { title: "Children on site", value: String(onSite), hint: `of ${branchKpis.totalStudents} active`, icon: Baby, href: "/attendance" },
    { title: "Staff on site", value: String(staffOnSite), hint: "1 substitute available", icon: UserCog, href: "/hr/staff" },
    { title: "Staff : child ratios", value: "Per class", hint: "Table below", icon: Users, href: "/classrooms" },
  ];

  const careOps: OpsCard[] = [
    { title: "Open incidents", value: "1", hint: "Issues / medication follow-up", icon: AlertTriangle, href: "/incidents" },
    { title: "Medication / treatment", value: "1 dose", hint: "Logged today · demo", icon: HeartPulse, href: "/therapy" },
    { title: "Today's menu", value: "Daal · rice · fruit", hint: "Kitchen plan · demo", icon: Utensils, href: "/settings" },
  ];

  const alertOps: OpsCard[] = [
    { title: "Low stock", value: "3", hint: "Branch reorder alerts", icon: Package, href: "/inventory/stock" },
    { title: "Maintenance", value: "1", hint: "Service reminder", icon: Wrench, href: "/maintenance" },
    { title: "Daily collection", value: formatCurrency(dailyCollection), hint: "Paid invoices (demo)", icon: BarChart3, href: "/billing" },
  ];

  const plannerDays = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const hasAdmin = i === 0 || i === 2 || i === 5;
      const hasAnnual = i === 3 || i === 10;
      return {
        key,
        label: d.getDate(),
        dow: d.toLocaleDateString(undefined, { weekday: "short" }),
        hasAdmin,
        hasAnnual,
      };
    });
  }, []);

  return (
    <div className="space-y-5">
      <CategoryNav items={NAV} />

      <SectionCategory
        id="dash-overview"
        eyebrow="Category 1"
        title="At a glance"
        description="Core headcount and pipeline — not finance."
      >
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </SectionCategory>

      <SectionCategory
        id="dash-branch"
        eyebrow="Category 2"
        title="Branch health"
        description="Evaluation header + last-month summary (HO formats TBD)."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-heading">Branch evaluation</h3>
              <span className="rounded-full bg-soft-green px-2.5 py-1 text-[11px] font-bold text-success">
                Satisfactory
              </span>
            </div>
            <p className="mt-2 text-xs text-muted">
              Full report format will be shared · Satisfactory / Unsatisfactory header.
            </p>
            <Link href="/reports" className="mt-3 inline-block text-xs font-semibold text-brand-600">
              Open analytics →
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-bg p-4">
            <h3 className="text-sm font-semibold text-heading">Branch summary — last month</h3>
            <p className="mt-2 text-xs text-muted">
              Monthly branch summary format will be shared. Placeholder for last-month KPIs.
            </p>
            <Link href="/reports" className="mt-3 inline-block text-xs font-semibold text-brand-600">
              View reports →
            </Link>
          </div>
        </div>
      </SectionCategory>

      <SectionCategory
        id="dash-people"
        eyebrow="Category 3"
        title="People on site"
        description="Live daily report — who is here and classroom ratios."
        action={
          <Link href="/classrooms" className="text-xs font-semibold text-brand-600">
            Classrooms →
          </Link>
        }
      >
        <OpsGrid items={peopleOps} />
        <div className="overflow-x-auto rounded-xl border border-border">
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
                <tr key={r.room} className="border-t border-border">
                  <td className="px-3 py-2.5 font-medium text-heading">{r.room}</td>
                  <td className="px-3 py-2.5 text-muted">{r.studentsIn}</td>
                  <td className="px-3 py-2.5 text-muted">{r.staffIn}</td>
                  <td className="px-3 py-2.5 text-muted">{r.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-border px-3 py-2 text-[11px] text-muted">
            Infant 4:1 · Toddler 6:1 · Pre/Nursery/KG 8:1 · Afterschool 10:1
          </p>
        </div>
      </SectionCategory>

      <SectionCategory
        id="dash-care"
        eyebrow="Category 4"
        title="Care & safety"
        description="Incidents, medication, and today’s menu."
      >
        <OpsGrid items={careOps} />
      </SectionCategory>

      <SectionCategory
        id="dash-ops"
        eyebrow="Category 5"
        title="Operations alerts"
        description="Stock, maintenance, and today’s collections pulse."
      >
        <OpsGrid items={alertOps} />
      </SectionCategory>

      <SectionCategory
        id="dash-calendar"
        eyebrow="Category 6"
        title="Calendar & celebrations"
        description="Planner markers and upcoming birthdays."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-bg p-4">
            <h3 className="text-sm font-semibold text-heading">Mini calendar</h3>
            <p className="text-[11px] text-muted">Annual · Admin planner (formats TBD)</p>
            <div className="mt-3 grid grid-cols-7 gap-1">
              {plannerDays.map((d) => (
                <div
                  key={d.key}
                  className={`rounded-lg px-1 py-2 text-center text-[10px] ${
                    d.hasAnnual
                      ? "bg-brand-500 text-white"
                      : d.hasAdmin
                        ? "bg-brand-50 text-brand-700"
                        : "bg-surface text-muted"
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

          <div className="rounded-xl border border-border bg-bg p-4">
            <div className="mb-3 flex items-center gap-2">
              <Cake className="h-4 w-4 text-brand-500" />
              <h3 className="text-sm font-semibold text-heading">Child birthdays</h3>
            </div>
            <ul className="space-y-2">
              {childBirthdays.map((b) => (
                <li key={b.id}>
                  <Link
                    href={b.href}
                    className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 text-sm hover:bg-brand-50"
                  >
                    <span className="font-medium text-heading">{b.name}</span>
                    <span className="text-[11px] text-muted">
                      {b.ageLabel} · {b.dateLabel}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-bg p-4">
            <div className="mb-3 flex items-center gap-2">
              <Cake className="h-4 w-4 text-brand-500" />
              <h3 className="text-sm font-semibold text-heading">Staff birthdays</h3>
            </div>
            <ul className="space-y-2">
              {staffBirthdays.map((b) => (
                <li key={b.id}>
                  <Link
                    href={b.href}
                    className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 text-sm hover:bg-brand-50"
                  >
                    <span className="font-medium text-heading">{b.name}</span>
                    <span className="text-[11px] text-muted">
                      {b.ageLabel} · {b.dateLabel}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SectionCategory>

      <SectionCategory
        id="dash-comms"
        eyebrow="Category 7"
        title="Communication log"
        description="Daily report / parent outreach pulse · format TBD with HO."
        action={
          <Link href="/communications" className="text-xs font-semibold text-brand-600">
            Open hub →
          </Link>
        }
      >
        <div className="mb-2 flex items-center gap-2 text-sm text-muted">
          <MessageSquare className="h-4 w-4 text-brand-500" />
          Recent outbound
        </div>
        <ul className="grid gap-2 text-sm sm:grid-cols-3">
          <li className="rounded-xl border border-border bg-bg px-3 py-2.5">
            <p className="font-medium text-heading">Emergency drill notice</p>
            <p className="text-[11px] text-muted">In-app · all parents · 08:05</p>
          </li>
          <li className="rounded-xl border border-border bg-bg px-3 py-2.5">
            <p className="font-medium text-heading">Fee reminder — August</p>
            <p className="text-[11px] text-muted">Push · families · yesterday</p>
          </li>
          <li className="rounded-xl border border-border bg-bg px-3 py-2.5">
            <p className="font-medium text-heading">PTM slots published</p>
            <p className="text-[11px] text-muted">Messages · Infant Room A</p>
          </li>
        </ul>
      </SectionCategory>

      <SectionCategory
        id="dash-finance"
        eyebrow="Category 8"
        title="Finance"
        description="Revenue and enrollments sit at the bottom per FE review."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <RevenueChart data={revenue} />
            <div className="rounded-xl border border-border bg-bg px-4 py-3 text-sm">
              <span className="text-muted">Monthly revenue · </span>
              <span className="font-bold text-heading">{formatCurrency(branchKpis.monthlyRevenue)}</span>
            </div>
          </div>
          <EnrollmentFeed items={filteredEnrollments} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/billing"
            className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700"
          >
            Billing & invoices
          </Link>
          <Link
            href="/billing/fee-locks"
            className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900"
          >
            HO fee / discount approvals
          </Link>
          <Link href="/finance" className="rounded-xl bg-bg px-3 py-2 text-xs font-semibold text-heading">
            Finance & accounts
          </Link>
        </div>
      </SectionCategory>
    </div>
  );
}
