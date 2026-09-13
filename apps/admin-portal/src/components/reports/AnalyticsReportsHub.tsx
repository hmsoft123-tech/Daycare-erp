"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Filter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BranchScorecard } from "@/components/reports/BranchScorecard";
import { BranchMap } from "@/components/reports/BranchMap";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { AnalyticsExtras } from "@/components/reports/AnalyticsExtras";
import { CategoryNav, SectionCategory } from "@/components/layout/SectionCategory";
import { cn } from "@/lib/utils";
import type { BranchScorecard as BranchScorecardType, BranchRevenue, RevenueDataPoint } from "@/types";
import { ReportsRevenueClient } from "@/app/(portal)/reports/ReportsRevenueClient";

type CategoryId =
  | "overview"
  | "finance"
  | "academic"
  | "operations"
  | "people"
  | "modules";

const TABS: { id: CategoryId; label: string; hint: string }[] = [
  { id: "overview", label: "Overview", hint: "Branch performance snapshot" },
  { id: "finance", label: "Finance & billing", hint: "Revenue, fees, reconciliation" },
  { id: "academic", label: "Academic & care", hint: "Attendance, progress, classrooms" },
  { id: "operations", label: "Operations", hint: "Inventory, PR, maintenance" },
  { id: "people", label: "People & engagement", hint: "HR, training, parent portal" },
  { id: "modules", label: "All modules", hint: "Full catalog · export demos" },
];

const MODULE_GROUPS: {
  category: Exclude<CategoryId, "overview" | "modules">;
  title: string;
  modules: { label: string; href: string; filters: string }[];
}[] = [
  {
    category: "finance",
    title: "Finance & billing",
    modules: [
      { label: "Finance & Accounts", href: "/finance", filters: "Branch · date · account type" },
      { label: "Billing & Fee Collection", href: "/billing/ops", filters: "Branch · class · status" },
      { label: "Reconciliation", href: "/billing/ops", filters: "Bank · KuickPay · period" },
    ],
  },
  {
    category: "academic",
    title: "Academic & care",
    modules: [
      { label: "Admissions / Inquiry & Leads", href: "/admissions", filters: "Source · stage · follow-up" },
      { label: "Enrollment", href: "/admissions", filters: "Branch · program · date" },
      { label: "Student Attendance", href: "/attendance", filters: "Branch · class · date" },
      { label: "Student Progress & Learning", href: "/academics", filters: "Class · student · term" },
      { label: "Academic Performance", href: "/academics", filters: "Class · subject · period" },
      { label: "Classroom & Daycare", href: "/classrooms", filters: "Room · ratio · capacity" },
      { label: "Parent Communication", href: "/communications", filters: "Channel · status · branch" },
      { label: "Events & Activities", href: "/communications", filters: "Date · branch · type" },
    ],
  },
  {
    category: "operations",
    title: "Operations",
    modules: [
      { label: "Inventory & Stock", href: "/inventory/stock", filters: "SKU · branch · low stock" },
      { label: "Procurement", href: "/inventory", filters: "PR category · approval · vendor" },
      { label: "Maintenance", href: "/maintenance", filters: "Category · vendor · branch" },
      { label: "Other operational reports", href: "/workflows", filters: "Workflow · status · owner" },
    ],
  },
  {
    category: "people",
    title: "People & engagement",
    modules: [
      { label: "Staff Attendance", href: "/hr/attendance", filters: "Branch · role · date" },
      { label: "HR / Staff", href: "/hr/staff", filters: "Role · branch · status" },
      { label: "Management / Branch Performance", href: "/reports", filters: "Branch · month · KPI" },
    ],
  },
];

type Props = {
  scorecards: BranchScorecardType[];
  branchRevenue: BranchRevenue[];
  revenue: RevenueDataPoint[];
};

function ModuleCards({
  modules,
}: {
  modules: { label: string; href: string; filters: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map((m) => (
        <Card key={m.label}>
          <CardContent className="flex h-full flex-col gap-2 p-4">
            <p className="text-sm font-semibold text-heading">{m.label}</p>
            <p className="text-[11px] text-muted">Filters · {m.filters}</p>
            <div className="mt-auto flex items-center justify-between gap-2 pt-1">
              <Link href={m.href} className="text-xs font-semibold text-brand-600">
                Open →
              </Link>
              <button
                type="button"
                className="text-[11px] font-semibold text-muted hover:text-heading"
                onClick={() => toast.success(`${m.label} · summary + detail export (demo)`)}
              >
                Export
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AnalyticsReportsHub({ scorecards, branchRevenue, revenue }: Props) {
  const [tab, setTab] = useState<CategoryId>("overview");

  const jumpNav = useMemo(
    () =>
      TABS.map((t) => ({
        id: `analytics-${t.id}`,
        label: t.label,
      })),
    []
  );

  return (
    <div className="space-y-5">
      <CategoryNav items={jumpNav} />

      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-border bg-surface p-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              document.getElementById(`analytics-${t.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={cn(
              "rounded-xl px-3 py-2 text-left text-xs font-semibold transition sm:min-w-[7.5rem]",
              tab === t.id ? "bg-brand-500 text-white shadow-sm" : "text-muted hover:bg-bg hover:text-heading"
            )}
          >
            <span className="block">{t.label}</span>
            <span className={cn("mt-0.5 hidden text-[10px] font-normal sm:block", tab === t.id ? "text-white/80" : "text-muted")}>
              {t.hint}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => toast.message("Filter panel · branch / date / class / status (demo)")}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => toast.success("Export started · CSV / PDF (demo)")}
        >
          <Download className="h-3.5 w-3.5" />
          Export category
        </Button>
      </div>

      {(tab === "overview" || tab === "modules") && (
        <SectionCategory
          id="analytics-overview"
          eyebrow="Overview"
          title="Branch performance"
          description="Scorecards and map — start here before diving into a category."
        >
          <BranchScorecard scorecards={scorecards} />
          <div className="grid gap-6 lg:grid-cols-2">
            <BranchMap />
            <RevenueChart data={revenue} />
          </div>
        </SectionCategory>
      )}

      {(tab === "finance" || tab === "modules" || tab === "overview") && (
        <SectionCategory
          id="analytics-finance"
          eyebrow="Finance & billing"
          title="Revenue & fee analytics"
          description="Charts and fee-pipeline reports."
        >
          <ReportsRevenueClient branchRevenue={branchRevenue} />
          {(tab === "finance" || tab === "modules") && (
            <ModuleCards modules={MODULE_GROUPS.find((g) => g.category === "finance")!.modules} />
          )}
        </SectionCategory>
      )}

      {(tab === "academic" || tab === "modules") && (
        <SectionCategory
          id="analytics-academic"
          eyebrow="Academic & care"
          title="Learning, attendance & classrooms"
          description="Student-facing academic and care metrics."
        >
          <AnalyticsExtras show="attendance" />
          <ModuleCards modules={MODULE_GROUPS.find((g) => g.category === "academic")!.modules} />
        </SectionCategory>
      )}

      {(tab === "operations" || tab === "modules") && (
        <SectionCategory
          id="analytics-operations"
          eyebrow="Operations"
          title="Inventory, procurement & maintenance"
          description="Stock and facilities reporting."
        >
          <ModuleCards modules={MODULE_GROUPS.find((g) => g.category === "operations")!.modules} />
        </SectionCategory>
      )}

      {(tab === "people" || tab === "modules") && (
        <SectionCategory
          id="analytics-people"
          eyebrow="People & engagement"
          title="Staff training & parent portal"
          description="HR completion and parent engagement demos."
        >
          <AnalyticsExtras show="people" />
          <ModuleCards modules={MODULE_GROUPS.find((g) => g.category === "people")!.modules} />
        </SectionCategory>
      )}

      {tab === "modules" && (
        <SectionCategory
          id="analytics-modules"
          eyebrow="All modules"
          title="Full report catalog"
          description="Every left-nav domain in one place — grouped above by category."
        >
          <p className="text-xs text-muted">
            Use the category tabs to focus on one domain. This view shows everything for HO review.
          </p>
        </SectionCategory>
      )}
    </div>
  );
}
