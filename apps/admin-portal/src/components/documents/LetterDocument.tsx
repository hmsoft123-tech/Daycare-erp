"use client";

import { SCHOOL_LETTERHEAD, fillTemplate } from "@/data/letters";
import type { LetterTemplate, LetterValues } from "@/types/letters";

type Props = {
  template: LetterTemplate;
  values: LetterValues;
};

export function LetterDocument({ template, values }: Props) {
  const v = values as Record<string, string>;
  const isCert = template.style === "certificate";

  return (
    <div
      className={
        isCert
          ? "letter-document mx-auto max-w-[800px] border-4 border-double border-brand-800 bg-white p-10 text-heading"
          : "letter-document mx-auto max-w-[800px] bg-white p-10 text-heading shadow-sm"
      }
    >
      <header className="border-b border-[#DFE3E8] pb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          {SCHOOL_LETTERHEAD.est}
        </p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-brand-900">
          {SCHOOL_LETTERHEAD.name}
        </h1>
        <p className="text-sm text-muted">{SCHOOL_LETTERHEAD.website}</p>
        {values.branchName && (
          <p className="mt-1 text-sm font-medium text-heading">{values.branchName}</p>
        )}
      </header>

      <div className="mt-6 text-center">
        <h2 className="font-heading text-xl font-bold uppercase tracking-wide underline decoration-brand-500 underline-offset-4">
          {template.title}
        </h2>
      </div>

      {/* Meta block for enrollment letter */}
      {template.kind === "enrollment_letter" && (
        <dl className="mt-6 grid gap-2 rounded-xl bg-bg/80 p-4 text-sm sm:grid-cols-2">
          <Meta label="Branch" value={values.branchName} />
          <Meta label="G.R. #" value={values.grNumber} />
          <Meta label="Child's Full Name" value={values.childFullName} />
          <Meta label="Date of Birth" value={values.dateOfBirth} />
          <Meta label="Father's Name" value={values.fatherName} />
          <Meta label="Joining Grade & Date" value={`${values.joiningGrade ?? ""} · ${values.joiningDate ?? ""}`} />
        </dl>
      )}

      <div className={`mt-6 space-y-4 text-sm leading-relaxed ${isCert ? "text-center" : "text-justify"}`}>
        {template.paragraphs.map((p, i) => (
          <p key={i}>{fillTemplate(p, v)}</p>
        ))}
        {template.closing?.map((line, i) => (
          <p key={`c-${i}`} className={line.startsWith("•") ? "pl-2 text-left" : undefined}>
            {fillTemplate(line, v)}
          </p>
        ))}
      </div>

      <footer className="mt-12 flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
        <div className="text-sm">
          <p className="text-muted">Date: {values.letterDate || values.issueDate || "____________"}</p>
        </div>
        <div className="text-sm sm:text-right">
          <p className="font-semibold">{values.coordinatorName || "Center Coordinator"}</p>
          <p className="text-muted">— Branch</p>
          <p className="mt-1 text-xs text-muted">{SCHOOL_LETTERHEAD.name}</p>
          <div className="mt-8 border-t border-heading/40 pt-1 text-xs text-muted">
            Signature &amp; stamp
          </div>
        </div>
      </footer>
    </div>
  );
}

function Meta({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-[#E8ECF0] pb-1">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  );
}
