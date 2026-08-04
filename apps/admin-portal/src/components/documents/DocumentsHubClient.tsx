"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LetterDocument } from "@/components/documents/LetterDocument";
import { LETTER_FIELD_LABELS, LETTER_TEMPLATES, getLetterTemplate } from "@/data/letters";
import { students } from "@/data/students";
import { staff } from "@/data/staff";
import { prefillStaffLetter, prefillStudentLetter } from "@/lib/letters";
import type { LetterAudience, LetterKind, LetterValues } from "@/types/letters";
import { FileText, Printer, X } from "lucide-react";
import { toast } from "sonner";

type Props = {
  /** Pre-select when opened from a profile */
  initialAudience?: LetterAudience;
  initialKind?: LetterKind;
  initialSubjectId?: string;
};

function resolveInitialKind(audience: LetterAudience, kind?: LetterKind): LetterKind {
  const match = LETTER_TEMPLATES.find((t) => t.kind === kind && t.audience === audience);
  if (match) return match.kind;
  return LETTER_TEMPLATES.find((t) => t.audience === audience)!.kind;
}

export function DocumentsHubClient({
  initialAudience = "student",
  initialKind,
  initialSubjectId,
}: Props) {
  const [audience, setAudience] = useState<LetterAudience>(initialAudience);
  const [kind, setKind] = useState<LetterKind>(() =>
    resolveInitialKind(initialAudience, initialKind)
  );
  const [subjectId, setSubjectId] = useState(initialSubjectId ?? "");
  const [values, setValues] = useState<LetterValues>(() => {
    const k = resolveInitialKind(initialAudience, initialKind);
    if (initialAudience === "student" && initialSubjectId) {
      const s = students.find((x) => x.id === initialSubjectId);
      if (s) return prefillStudentLetter(s, k);
    }
    if (initialAudience === "staff" && initialSubjectId) {
      const m = staff.find((x) => x.id === initialSubjectId);
      if (m) return prefillStaffLetter(m, k);
    }
    return {
      letterDate: "",
      issueDate: "",
      coordinatorName:
        initialAudience === "staff" ? "HR / Center Coordinator" : "Center Coordinator",
    };
  });
  const [previewOpen, setPreviewOpen] = useState(false);

  const templates = useMemo(
    () => LETTER_TEMPLATES.filter((t) => t.audience === audience),
    [audience]
  );
  const template = getLetterTemplate(kind) ?? templates[0];

  const subjects = audience === "student" ? students : staff;

  const onAudienceChange = (a: LetterAudience) => {
    setAudience(a);
    const first = LETTER_TEMPLATES.find((t) => t.audience === a)!;
    setKind(first.kind);
    setSubjectId("");
    setValues({ letterDate: "", issueDate: "", coordinatorName: a === "staff" ? "HR / Center Coordinator" : "Center Coordinator" });
  };

  const onSubjectChange = (id: string) => {
    setSubjectId(id);
    if (audience === "student") {
      const s = students.find((x) => x.id === id);
      if (s) setValues(prefillStudentLetter(s, kind));
    } else {
      const m = staff.find((x) => x.id === id);
      if (m) setValues(prefillStaffLetter(m, kind));
    }
  };

  const onKindChange = (k: LetterKind) => {
    setKind(k);
    if (!subjectId) return;
    if (audience === "student") {
      const s = students.find((x) => x.id === subjectId);
      if (s) setValues(prefillStudentLetter(s, k));
    } else {
      const m = staff.find((x) => x.id === subjectId);
      if (m) setValues(prefillStaffLetter(m, k));
    }
  };

  const openPreview = () => {
    if (!template) return;
    const missing = template.fields.filter((f) => !values[f]?.trim());
    if (missing.length > 2) {
      toast.error("Fill the key fields before preview (name, branch, dates).");
      return;
    }
    setPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-100 bg-brand-50/40 px-4 py-3 text-sm text-heading">
        Generate printable <span className="font-semibold">enrollment letters</span>, leaving /
        clearance certificates, and staff experience / offer / promotion / exit letters. Enrollment
        letter follows the SDLC Child Enrollment Letter format.
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4 rounded-2xl bg-surface p-5 shadow-card">
          <div>
            <Label>Audience</Label>
            <Select value={audience} onValueChange={(v) => onAudienceChange(v as LetterAudience)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student / child</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Document type</Label>
            <Select value={kind} onValueChange={(v) => onKindChange(v as LetterKind)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.kind} value={t.kind}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {template && <p className="mt-1 text-xs text-muted">{template.subtitle}</p>}
          </div>
          <div>
            <Label>{audience === "student" ? "Student" : "Staff member"}</Label>
            <Select value={subjectId} onValueChange={onSubjectChange}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select to auto-fill" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {"firstName" in s ? `${s.firstName} ${s.lastName}` : s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="max-h-[420px] space-y-3 overflow-y-auto border-t border-[#F1F3F5] pt-4">
            {template?.fields.map((field) => (
              <div key={field}>
                <Label htmlFor={field}>{LETTER_FIELD_LABELS[field]}</Label>
                <Input
                  id={field}
                  className="mt-1"
                  value={values[field] ?? ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <Button className="w-full" onClick={openPreview}>
            <FileText className="h-4 w-4" />
            Preview &amp; print
          </Button>
        </div>

        <div className="hidden rounded-2xl border border-dashed border-[#DFE3E8] bg-bg/50 p-6 lg:block">
          <p className="mb-4 text-xs font-bold uppercase tracking-wide text-muted">Live preview</p>
          {template && <LetterDocument template={template} values={values} />}
        </div>
      </div>

      {previewOpen && template && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/50 print:static print:inset-auto print:bg-white">
          <div className="flex items-center justify-between gap-3 bg-white px-4 py-3 shadow print:hidden">
            <div>
              <p className="font-heading text-sm font-bold text-heading">{template.title}</p>
              <p className="text-xs text-muted">{template.subtitle}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 print:overflow-visible print:p-0">
            <LetterDocument template={template} values={values} />
          </div>
        </div>
      )}

    </div>
  );
}
