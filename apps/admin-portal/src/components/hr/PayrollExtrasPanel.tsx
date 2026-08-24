"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { payrollExtras } from "@/data/extended-ops";
import { formatCurrency, cn } from "@/lib/utils";

const kinds = ["all", "pf", "loan", "advance", "bonus", "relief", "increment"] as const;

export function PayrollExtrasPanel() {
  const [kind, setKind] = useState<(typeof kinds)[number]>("all");
  const rows = useMemo(
    () => (kind === "all" ? payrollExtras : payrollExtras.filter((p) => p.kind === kind)),
    [kind]
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-heading">Payroll extras</p>
        <p className="text-xs text-muted">
          PF · loans · advances · bonus · relief · increments (SDLC payroll workflow)
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {kinds.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold capitalize",
              kind === k ? "bg-brand-500 text-white" : "bg-bg text-muted"
            )}
          >
            {k === "all" ? "All" : k}
          </button>
        ))}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <li key={r.id}>
            <Card>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{r.staffName}</p>
                    <p className="text-[11px] capitalize text-muted">
                      {r.kind} · {r.effectiveMonth}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {r.status}
                  </Badge>
                </div>
                <p className="font-heading text-xl font-bold">
                  {r.kind === "increment" ? `${r.amount}%` : formatCurrency(r.amount)}
                </p>
                <p className="text-xs text-muted">{r.note}</p>
                {r.meta && (
                  <p className="text-[11px] text-muted">
                    {Object.entries(r.meta)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" · ")}
                  </p>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
