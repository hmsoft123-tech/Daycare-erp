"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CLASS_GROUPS } from "@/data/services";
import {
  SERVICE_CATEGORY_LABEL,
  planAdmissionFee,
  planLabel,
  planMonthlyTotal,
} from "@/lib/services-catalog";
import { formatCurrency } from "@/lib/utils";
import type { ServiceCategory, ServiceOffering, ServiceTier } from "@/types";

type Props = {
  offerings: ServiceOffering[];
};

const TABS: { id: ServiceCategory | "plans"; label: string }[] = [
  { id: "plans", label: "Class plans" },
  { id: "extra_care", label: "Extra care" },
  { id: "value_added", label: "Value-added" },
  { id: "learning", label: "Learning & tuition" },
  { id: "recreational", label: "Recreational" },
  { id: "registration", label: "Registration" },
  { id: "after_school", label: "After-school" },
];

const TIERS: ServiceTier[] = ["base", "lite", "plus", "pro"];

export function ServicesCatalogueClient({ offerings }: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return offerings;
    return offerings.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query) ||
        s.category.includes(query) ||
        (s.ageBand?.toLowerCase().includes(query) ?? false)
    );
  }, [offerings, q]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand-100 bg-brand-50/40 px-4 py-3 text-sm text-heading">
        <span className="font-semibold">SDLC Fee {offerings[0]?.sessionYear ?? "2026-2027"}: </span>
        Core class (Base) + Extra Care Lite/Plus/Pro · value-added meals/Saturday/Quran · after-school
        learning &amp; recreational programs. Annual charges = monthly fee (due in March).
      </div>

      <Input
        placeholder="Search service, code, age band…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-md"
      />

      <Tabs defaultValue="plans">
        <TabsList className="flex h-auto flex-wrap">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="plans" className="mt-4">
          <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
            <table className="w-full text-sm">
              <thead className="border-b border-[#F1F3F5] bg-[#F9FAFB]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted">Class</th>
                  {TIERS.map((t) => (
                    <th key={t} className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted">
                      {t}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted">
                    Admission
                  </th>
                </tr>
              </thead>
              <tbody>
                {CLASS_GROUPS.map((g) => (
                  <tr key={g.id} className="border-b border-[#F1F3F5] last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-heading">{g.label}</p>
                      <p className="text-xs text-muted">{g.ageBand}</p>
                    </td>
                    {TIERS.map((tier) => {
                      if (g.id === "after_school" && (tier === "base" || tier === "pro")) {
                        return (
                          <td key={tier} className="px-4 py-3 text-right text-muted">
                            —
                          </td>
                        );
                      }
                      return (
                        <td key={tier} className="px-4 py-3 text-right">
                          <p className="font-medium">{formatCurrency(planMonthlyTotal(g.id, tier))}</p>
                          <p className="text-[10px] text-muted">{planLabel(g.id, tier)}</p>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(planAdmissionFee(g.id, g.id === "after_school" ? "lite" : "base"))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">
            Infant–KG: monthly = Base + Extra Care (Lite/Plus/Pro). After-School Care: Lite (1–3h) /
            Plus (1–7h) only.
          </p>
        </TabsContent>

        {TABS.filter((t) => t.id !== "plans").map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-4">
            <ServiceTable
              title={SERVICE_CATEGORY_LABEL[tab.id as ServiceCategory]}
              rows={filtered.filter((s) => s.category === tab.id)}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ServiceTable({ title, rows }: { title: string; rows: ServiceOffering[] }) {
  if (!rows.length) {
    return (
      <p className="rounded-2xl border border-dashed border-[#DFE3E8] px-4 py-10 text-center text-sm text-muted">
        No {title.toLowerCase()} match your search.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
      <table className="w-full text-sm">
        <thead className="border-b border-[#F1F3F5] bg-[#F9FAFB]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted">Code</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted">Service</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted">Details</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted">Monthly</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted">Other</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="border-b border-[#F1F3F5] last:border-0">
              <td className="px-4 py-3 font-mono text-xs text-muted">{s.code}</td>
              <td className="px-4 py-3">
                <p className="font-medium text-heading">{s.name}</p>
                {s.tier && (
                  <Badge variant="info" className="mt-1 capitalize">
                    {s.tier}
                  </Badge>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-muted">
                {[s.ageBand, s.schedule, s.description].filter(Boolean).join(" · ")}
              </td>
              <td className="px-4 py-3 text-right font-medium">
                {s.monthlyFee > 0 ? formatCurrency(s.monthlyFee) : "—"}
              </td>
              <td className="px-4 py-3 text-right text-xs text-muted">
                {s.admissionFee ? `Adm ${formatCurrency(s.admissionFee)}` : ""}
                {s.registrationFee ? `Reg ${formatCurrency(s.registrationFee)}` : ""}
                {s.annualSameAsMonthly ? " · Annual = monthly" : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
