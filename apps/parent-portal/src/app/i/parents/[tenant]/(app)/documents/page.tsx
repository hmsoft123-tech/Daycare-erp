"use client";

import { FileText } from "lucide-react";

const docs = [
  { title: "Enrollment confirmation letter", kind: "Enrollment", child: "Hamdan Khan" },
  { title: "Fee challan — August", kind: "Fees", child: "Zainab Siddiqui" },
  { title: "Pick & drop information sheet", kind: "Pickup", child: "All children" },
  { title: "Photo consent form (signed)", kind: "Consent", child: "Hamdan Khan" },
];

export default function DocumentsPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <section>
        <h1 className="font-heading text-xl font-bold text-heading md:text-2xl">Documents</h1>
        <p className="mt-1 text-sm text-muted">Letters and forms issued for your children</p>
      </section>
      <ul className="space-y-2">
        {docs.map((d) => (
          <li key={d.title} className="flex items-start gap-3 rounded-2xl bg-surface p-4 shadow-card">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-heading">{d.title}</p>
              <p className="text-xs text-muted">
                {d.kind} · {d.child}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
