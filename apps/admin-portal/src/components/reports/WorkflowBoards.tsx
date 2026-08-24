"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const billingSteps = [
  { step: "Fee schedule", status: "done", note: "Plans & services" },
  { step: "Generate challan / invoice", status: "done", note: "Bank Al Habib format" },
  { step: "HO fee-lock (if unpaid enrol)", status: "done", note: "/billing/fee-locks" },
  { step: "Parent online pay (demo)", status: "live", note: "JazzCash / card / bank" },
  { step: "Receipt & unlock portal", status: "live", note: "Parent Payments" },
  { step: "Overdue / revision letter", status: "done", note: "Documents hub" },
];

const studentSteps = [
  { step: "Inquiry → enrollment wizard", status: "done" },
  { step: "G.R. / ID / classroom assign", status: "done" },
  { step: "Attendance + Academics sync", status: "done" },
  { step: "Lifecycle: transfer / alumni", status: "done" },
  { step: "Letters: enroll / leave / clearance", status: "done" },
  { step: "ABC incidents + parent notify", status: "live" },
];

const inventorySteps = [
  { step: "Catalogue items", status: "done" },
  { step: "Stock levels / adjust", status: "done" },
  { step: "PR: pending → billed → paid", status: "done" },
  { step: "Dispatch → receive", status: "done" },
  { step: "Library books (separate)", status: "live" },
];

function Board({
  title,
  items,
}: {
  title: string;
  items: { step: string; status: string; note?: string }[];
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="text-sm font-semibold">{title}</p>
        <ol className="space-y-2">
          {items.map((s, i) => (
            <li
              key={s.step}
              className="flex items-start justify-between gap-2 rounded-xl border border-[#F1F3F5] px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">
                  {i + 1}. {s.step}
                </p>
                {s.note && <p className="text-[11px] text-muted">{s.note}</p>}
              </div>
              <Badge variant={s.status === "live" ? "success" : "secondary"} className="capitalize">
                {s.status}
              </Badge>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export function WorkflowBoards() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Board title="Billing workflow" items={billingSteps} />
      <Board title="Students workflow" items={studentSteps} />
      <Board title="Inventory workflow" items={inventorySteps} />
    </div>
  );
}
