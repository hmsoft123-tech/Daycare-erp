"use client";

import { SchoolPageHeader } from "@/components/school/SchoolPageHeader";
import { mockChildren } from "@/data/mock";

const docs = [
  { title: "Child enrollment / joining letter", kind: "Admission", child: "Hamdan Khan" },
  { title: "Parent consent — targeted school", kind: "Consent", child: "Hamdan Khan" },
  { title: "Pick & drop information sheet", kind: "Pickup", child: "All children" },
  { title: "Fee revision letter (Aug)", kind: "Fee", child: "Zainab Siddiqui" },
  { title: "Leaving certificate (template)", kind: "Leaving", child: "—" },
  { title: "Hygiene / daily summary (sample)", kind: "Daily", child: "Hamdan Khan" },
  { title: "Incident report (ABC) — view only if issued", kind: "Incident", child: "—" },
];

export default function DocumentsPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <SchoolPageHeader
        title="Documents"
        subtitle="Enrollment, consent, pickup, fee letters & certificates"
      />
      <p className="text-xs text-muted">
        Linked to {mockChildren.filter((c) => c.enrollmentStatus === "active").length} active
        children · printable copies issued by admin Documents hub
      </p>
      <ul className="space-y-2">
        {docs.map((d) => (
          <li
            key={d.title}
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface p-4 shadow-card"
          >
            <div>
              <p className="text-sm font-bold text-heading">{d.title}</p>
              <p className="text-xs text-muted">{d.child}</p>
            </div>
            <span className="rounded-full bg-bg px-2.5 py-0.5 text-[10px] font-bold text-muted">
              {d.kind}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
