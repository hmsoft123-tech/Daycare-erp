"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { branches } from "@/data/branches";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { JobApplicationForm } from "@/types";

export function JobApplicationPanel({ application }: { application?: JobApplicationForm }) {
  if (!application) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted">
          No SDLC Employee Application Form on file yet. Complete Hiring Wizard or public apply link.
        </CardContent>
      </Card>
    );
  }

  const branch = branches.find((b) => b.id === application.branchId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Employee Application Form</CardTitle>
          <p className="text-xs text-muted">
            {application.fullName} · {application.designation} · {branch?.name}
            {application.appliedAt ? ` · applied ${formatDate(application.appliedAt.slice(0, 10))}` : ""}
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Info label="CNIC" value={application.cnic} />
          <Info label="Father / Husband" value={application.fatherHusbandName} />
          <Info label="Date of birth" value={application.dateOfBirth ? formatDate(application.dateOfBirth) : "—"} />
          <Info label="Marital status" value={application.maritalStatus || "—"} />
          <Info label="Mobile" value={application.mobilePhone} />
          <Info label="Home phone" value={application.homePhone || "—"} />
          <Info label="Email" value={application.email} />
          <div className="sm:col-span-2">
            <Info label="Home address" value={application.homeAddress} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Education</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {application.education
            .filter((e) => e.institute || e.subject || e.year)
            .map((e) => (
              <div key={e.level} className="flex flex-wrap justify-between gap-2 border-b border-[#F1F3F5] py-2 last:border-0">
                <span className="font-medium capitalize">{e.level}</span>
                <span className="text-muted">
                  {[e.institute, e.subject, e.year].filter(Boolean).join(" · ")}
                </span>
              </div>
            ))}
        </CardContent>
      </Card>

      {application.workExperience.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Work experience</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {application.workExperience.map((w, i) => (
              <div key={i} className="border-b border-[#F1F3F5] py-2 last:border-0">
                <p className="font-medium">{w.jobTitle || "—"} @ {w.company || "—"}</p>
                <p className="text-xs text-muted">
                  {w.joiningLeaving || "—"}
                  {w.salary ? ` · ${w.salary}` : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>References</CardTitle></CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <RefBlock title="Reference #1" r={application.reference1} />
          <RefBlock title="Reference #2" r={application.reference2} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Questionnaire</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <QA q="About SDLC" a={application.knowAboutSdlc} />
          <QA q="Best suited" a={application.whyBestSuited} />
          <QA q="Respect" a={application.respectMeaning} />
          <QA q="Technology in education" a={application.techInEducation} />
          <QA q="Documentation" a={application.documentationImportance} />
        </CardContent>
      </Card>

      {(application.joiningDate || application.salary || application.jobHours) && (
        <Card>
          <CardHeader><CardTitle>Official use</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Job hours" value={application.jobHours || "—"} />
            <Info label="Joining date" value={application.joiningDate ? formatDate(application.joiningDate) : "—"} />
            <Info
              label="Salary"
              value={application.salary != null ? formatCurrency(application.salary) : "—"}
            />
            <Info label="Interview" value={application.firstInterviewDate ? formatDate(application.firstInterviewDate) : "—"} />
            <Info label="Demonstration" value={application.demonstrationDate ? formatDate(application.demonstrationDate) : "—"} />
            <Info label="Training period" value={application.trainingPeriod || "—"} />
            <Info label="Code" value={application.staffCode || "—"} />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {application.languages.map((l) => (
          <Badge key={l.language} variant="secondary" className="capitalize">
            {l.language}: {l.spoken}/{l.written}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted">{label}</p>
      <p className="font-medium text-heading">{value}</p>
    </div>
  );
}

function RefBlock({
  title,
  r,
}: {
  title: string;
  r: JobApplicationForm["reference1"];
}) {
  return (
    <div className="rounded-xl bg-bg px-3 py-2">
      <p className="text-xs font-semibold text-muted">{title}</p>
      <p className="font-medium">{r.name || "—"}</p>
      <p className="text-xs text-muted">
        {[r.relation, r.occupation, r.contact].filter(Boolean).join(" · ") || "—"}
      </p>
    </div>
  );
}

function QA({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-muted">{q}</p>
      <p className="text-heading">{a || "—"}</p>
    </div>
  );
}
