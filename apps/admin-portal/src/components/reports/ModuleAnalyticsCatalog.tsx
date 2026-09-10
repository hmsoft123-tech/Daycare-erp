"use client";

import Link from "next/link";
import { Download, Filter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const MODULES = [
  { label: "Finance & Accounts", href: "/finance", filters: "Branch · date · account type" },
  { label: "Billing & Fee Collection", href: "/billing/ops", filters: "Branch · class · status" },
  { label: "Reconciliation", href: "/billing/ops", filters: "Bank · KuickPay · period" },
  { label: "Admissions / Inquiry & Leads", href: "/admissions", filters: "Source · stage · follow-up" },
  { label: "Enrollment", href: "/admissions", filters: "Branch · program · date" },
  { label: "Student Attendance", href: "/attendance", filters: "Branch · class · date" },
  { label: "Staff Attendance", href: "/hr/attendance", filters: "Branch · role · date" },
  { label: "Student Progress & Learning", href: "/academics", filters: "Class · student · term" },
  { label: "Academic Performance", href: "/academics", filters: "Class · subject · period" },
  { label: "Classroom & Daycare", href: "/classrooms", filters: "Room · ratio · capacity" },
  { label: "Parent Communication", href: "/communications", filters: "Channel · status · branch" },
  { label: "Inventory & Stock", href: "/inventory/stock", filters: "SKU · branch · low stock" },
  { label: "Procurement", href: "/inventory", filters: "PR category · approval · vendor" },
  { label: "Maintenance", href: "/maintenance", filters: "Category · vendor · branch" },
  { label: "HR / Staff", href: "/hr/staff", filters: "Role · branch · status" },
  { label: "Events & Activities", href: "/communications", filters: "Date · branch · type" },
  { label: "Management / Branch Performance", href: "/reports", filters: "Branch · month · KPI" },
  { label: "Other operational reports", href: "/workflows", filters: "Workflow · status · owner" },
] as const;

export function ModuleAnalyticsCatalog() {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-heading">
            Centralized module analytics
          </h2>
          <p className="text-xs text-muted">
            FE review · every left-nav domain · filterable & exportable (demo)
          </p>
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
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
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
    </section>
  );
}
