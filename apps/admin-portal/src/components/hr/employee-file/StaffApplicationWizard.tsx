"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, FolderOpen, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SignaturePad } from "@/components/admissions/SignaturePad";
import { EmployeeFileSlot } from "@/components/hr/employee-file/EmployeeFileSlot";
import { EMPLOYEE_FILE_INTRO } from "@/data/employee-file";
import { branches } from "@/data/branches";
import {
  emptyEmployeeFile,
  entryMap,
  mergeEmployeeFile,
  missingRequiredHire,
  slotsForAdminHire,
  slotsForPublicHire,
} from "@/lib/employee-file";
import { completeHireInvite } from "@/lib/hire-invite-store";
import { cn } from "@/lib/utils";
import type {
  AdditionalCourseRow,
  ApplicationReference,
  EducationRow,
  EmployeeFileEntry,
  EmployeeFileSlotKey,
  ItSkillRow,
  JobApplicationForm,
  LanguageSkillRow,
  SkillLevel,
  StaffRole,
  WorkExperienceRow,
} from "@/types";
import { toast } from "sonner";

type Mode = "admin" | "public";

type Prefill = {
  name?: string;
  email?: string;
  phone?: string;
  role?: StaffRole;
  branchId?: string;
  offeredSalary?: number;
  joiningDate?: string;
  employmentType?: "full_time" | "part_time" | "contract";
  probationMonths?: number;
};

type Props = {
  mode?: Mode;
  inviteToken?: string;
  schoolName?: string;
  prefill?: Prefill;
  initialFile?: EmployeeFileEntry[];
  onPublicComplete?: (payload: {
    name: string;
    employeeFile: EmployeeFileEntry[];
    signature: string;
    jobApplication: JobApplicationForm;
  }) => void;
  onAdminComplete?: (payload: {
    values: Prefill & { name: string; email: string; phone: string };
    employeeFile: EmployeeFileEntry[];
    signature: string;
    jobApplication: JobApplicationForm;
  }) => void;
};

const STEPS = [
  { id: 1, title: "Personal", short: "Personal" },
  { id: 2, title: "Education", short: "Education" },
  { id: 3, title: "Experience", short: "Experience" },
  { id: 4, title: "Skills & references", short: "Skills" },
  { id: 5, title: "Questions", short: "Questions" },
  { id: 6, title: "Documents", short: "Docs" },
  { id: 7, title: "Sign-off", short: "Sign" },
];

const EDU_LEVELS: EducationRow["level"][] = ["masters", "bachelors", "diploma", "hsc", "ssc"];
const EDU_LABELS: Record<EducationRow["level"], string> = {
  masters: "Masters",
  bachelors: "Bachelors",
  diploma: "Diploma",
  hsc: "H.S.C / A Level",
  ssc: "S.S.C / O Level",
};

const IT_SKILLS = [
  "MS WORD",
  "MS EXCEL",
  "MS POWER POINT",
  "IN-PAGE",
  "PHOTO-EDITING",
  "SOCIAL NETWORKING",
];

const emptyRef = (): ApplicationReference => ({
  name: "",
  relation: "",
  cnic: "",
  contact: "",
  occupation: "",
  duration: "",
});

const emptyEdu = (): EducationRow[] =>
  EDU_LEVELS.map((level) => ({ level, institute: "", subject: "", year: "" }));

const emptyWork = (): WorkExperienceRow[] => [
  { company: "", jobTitle: "", joiningLeaving: "", salary: "" },
  { company: "", jobTitle: "", joiningLeaving: "", salary: "" },
];

const emptyCourses = (): AdditionalCourseRow[] => [
  { title: "", institute: "", duration: "", date: "" },
];

const emptyLangs = (): LanguageSkillRow[] => [
  { language: "urdu", written: "strong", spoken: "strong", understanding: "strong" },
  { language: "english", written: "strong", spoken: "strong", understanding: "strong" },
];

const emptyIt = (): ItSkillRow[] =>
  IT_SKILLS.map((skill) => ({ skill, level: "nil" as SkillLevel }));

const roleToDesignation = (role: StaffRole) => {
  const map: Record<StaffRole, string> = {
    teacher: "Class Teacher",
    therapist: "Therapist",
    admin: "Administrator",
    support: "Support Staff",
    accountant: "Accountant",
    executive: "Executive",
  };
  return map[role];
};

export function StaffApplicationWizard({
  mode = "public",
  inviteToken,
  schoolName = "Dr. Sofia’s Daycare",
  prefill,
  initialFile,
  onPublicComplete,
  onAdminComplete,
}: Props) {
  const isPublic = mode === "public";
  const slots = useMemo(
    () => (isPublic ? slotsForPublicHire() : slotsForAdminHire()),
    [isPublic]
  );

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(prefill?.name ?? "");
  const [cnic, setCnic] = useState("");
  const [role, setRole] = useState<StaffRole>(prefill?.role ?? "teacher");
  const [designation, setDesignation] = useState(roleToDesignation(prefill?.role ?? "teacher"));
  const [branchId, setBranchId] = useState(prefill?.branchId ?? branches[0]?.id ?? "");
  const [fatherHusbandName, setFatherHusbandName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [maritalStatus, setMaritalStatus] = useState<JobApplicationForm["maritalStatus"]>("");
  const [homeAddress, setHomeAddress] = useState("");
  const [homePhone, setHomePhone] = useState("");
  const [mobilePhone, setMobilePhone] = useState(prefill?.phone ?? "");
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [passportPhotoName, setPassportPhotoName] = useState("");

  const [education, setEducation] = useState(emptyEdu);
  const [workExperience, setWorkExperience] = useState(emptyWork);
  const [additionalCourses, setAdditionalCourses] = useState(emptyCourses);
  const [languages, setLanguages] = useState(emptyLangs);
  const [itSkills, setItSkills] = useState(emptyIt);
  const [reference1, setReference1] = useState(emptyRef);
  const [reference2, setReference2] = useState(emptyRef);

  const [knowAboutSdlc, setKnowAboutSdlc] = useState("");
  const [whyBestSuited, setWhyBestSuited] = useState("");
  const [respectMeaning, setRespectMeaning] = useState("");
  const [techInEducation, setTechInEducation] = useState("");
  const [documentationImportance, setDocumentationImportance] = useState("");

  const [employmentType, setEmploymentType] = useState<"full_time" | "part_time" | "contract">(
    prefill?.employmentType ?? "full_time"
  );
  const [joiningDate, setJoiningDate] = useState(prefill?.joiningDate ?? "");
  const [offeredSalary, setOfferedSalary] = useState(String(prefill?.offeredSalary ?? ""));
  const [probationMonths, setProbationMonths] = useState(String(prefill?.probationMonths ?? 3));
  const [jobHours, setJobHours] = useState("");
  const [firstInterviewDate, setFirstInterviewDate] = useState("");
  const [demonstrationDate, setDemonstrationDate] = useState("");
  const [trainingPeriod, setTrainingPeriod] = useState("");
  const [staffCode, setStaffCode] = useState("");

  const [file, setFile] = useState<EmployeeFileEntry[]>(
    initialFile?.length ? initialFile : emptyEmployeeFile()
  );
  const [policiesAccepted, setPoliciesAccepted] = useState(false);
  const [signature, setSignature] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const map = entryMap(file);

  useEffect(() => {
    setDesignation(roleToDesignation(role));
  }, [role]);

  const setSlotFile = (key: EmployeeFileSlotKey, fileName: string) => {
    setFile((prev) =>
      mergeEmployeeFile(prev, {
        [key]: {
          received: true,
          fileName,
          receivedAt: new Date().toISOString().slice(0, 10),
        },
      })
    );
  };

  const buildApplication = (): JobApplicationForm => ({
    fullName: fullName.trim(),
    cnic: cnic.trim(),
    designation: designation.trim(),
    branchId,
    fatherHusbandName: fatherHusbandName.trim(),
    dateOfBirth,
    maritalStatus,
    homeAddress: homeAddress.trim(),
    homePhone: homePhone.trim(),
    mobilePhone: mobilePhone.trim(),
    email: email.trim(),
    passportPhotoName: passportPhotoName || undefined,
    education,
    workExperience: workExperience.filter((w) => w.company.trim() || w.jobTitle.trim()),
    additionalCourses: additionalCourses.filter((c) => c.title.trim()),
    languages,
    itSkills,
    reference1,
    reference2,
    knowAboutSdlc: knowAboutSdlc.trim(),
    whyBestSuited: whyBestSuited.trim(),
    respectMeaning: respectMeaning.trim(),
    techInEducation: techInEducation.trim(),
    documentationImportance: documentationImportance.trim(),
    jobHours: jobHours.trim() || undefined,
    joiningDate: joiningDate || undefined,
    salary: offeredSalary ? Number(offeredSalary) : undefined,
    firstInterviewDate: firstInterviewDate || undefined,
    demonstrationDate: demonstrationDate || undefined,
    trainingPeriod: trainingPeriod.trim() || undefined,
    staffCode: staffCode.trim() || undefined,
    appliedAt: new Date().toISOString(),
    signatureDataUrl: signature,
  });

  const validateStep = (s: number) => {
    const next: Record<string, string> = {};
    if (s === 1) {
      if (fullName.trim().length < 2) next.fullName = "Full name required";
      if (cnic.trim().length < 5) next.cnic = "CNIC required";
      if (!dateOfBirth) next.dateOfBirth = "Date of birth required";
      if (fatherHusbandName.trim().length < 2) next.fatherHusbandName = "Father/Husband name required";
      if (!maritalStatus) next.maritalStatus = "Marital status required";
      if (homeAddress.trim().length < 8) next.homeAddress = "Home address required";
      if (mobilePhone.trim().length < 10) next.mobilePhone = "Mobile number required";
      if (!email.includes("@")) next.email = "Valid email required";
      if (!passportPhotoName) next.passportPhotoName = "Passport photograph required";
    }
    if (s === 2) {
      const filled = education.some((e) => e.institute.trim() || e.subject.trim() || e.year.trim());
      if (!filled) next.education = "Enter at least one education row";
    }
    if (s === 4) {
      if (reference1.name.trim().length < 2) next.ref1 = "Reference #1 name required";
      if (reference1.contact.trim().length < 7) next.ref1c = "Reference #1 contact required";
      if (reference2.name.trim().length < 2) next.ref2 = "Reference #2 name required";
      if (reference2.contact.trim().length < 7) next.ref2c = "Reference #2 contact required";
    }
    if (s === 5) {
      if (knowAboutSdlc.trim().length < 10) next.knowAboutSdlc = "Please answer";
      if (whyBestSuited.trim().length < 10) next.whyBestSuited = "Please answer";
      if (respectMeaning.trim().length < 5) next.respectMeaning = "Please answer";
      if (techInEducation.trim().length < 5) next.techInEducation = "Please answer";
      if (documentationImportance.trim().length < 5) next.documentationImportance = "Please answer";
    }
    if (s === 6) {
      const missing = missingRequiredHire(file, isPublic ? "public" : "admin").filter(
        (m) => m.key !== "staff_id_card" && m.key !== "job_application"
      );
      if (missing.length) {
        next.file = `Upload compulsory items: ${missing.map((m) => m.letter).join(", ")}`;
        for (const m of missing) next[`slot_${m.key}`] = "Required";
      }
    }
    if (s === 7) {
      if (!isPublic) {
        if (!joiningDate) next.joiningDate = "Joining date required";
        const months = Number(probationMonths);
        if (Number.isNaN(months) || months < 0) next.probationMonths = "Valid probation months required";
      }
      if (!policiesAccepted) next.policies = "Accept declaration to continue";
      if (signature.length < 20) next.signature = "Applicant signature required";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((v) => Math.min(7, v + 1));
  };

  const submit = () => {
    if (!validateStep(7)) return;
    const jobApplication = buildApplication();

    const withDocs = mergeEmployeeFile(file, {
      signed_hr_policies: {
        received: true,
        fileName: "hr-policies-signed-digital.pdf",
        receivedAt: new Date().toISOString().slice(0, 10),
      },
      job_application: {
        received: true,
        fileName: "employee-application-form-digital.pdf",
        receivedAt: new Date().toISOString().slice(0, 10),
      },
      passport_photo: passportPhotoName
        ? {
            received: true,
            fileName: passportPhotoName,
            receivedAt: new Date().toISOString().slice(0, 10),
          }
        : map.passport_photo,
      detailed_form: map.detailed_form.received
        ? map.detailed_form
        : {
            received: true,
            fileName: "employees-detailed-form-from-application.pdf",
            receivedAt: new Date().toISOString().slice(0, 10),
          },
    });

    if (isPublic && inviteToken) {
      completeHireInvite(inviteToken, {
        employeeFile: withDocs,
        hrPoliciesSignature: signature,
        prefill: {
          name: fullName.trim(),
          email: email.trim(),
          phone: mobilePhone.trim(),
          role,
          branchId,
          joiningDate: joiningDate || undefined,
          employmentType,
          offeredSalary: offeredSalary ? Number(offeredSalary) : undefined,
        },
      });
      toast.success("Application submitted to HR");
      onPublicComplete?.({
        name: fullName.trim(),
        employeeFile: withDocs,
        signature,
        jobApplication,
      });
      return;
    }

    if (!onAdminComplete) {
      toast.error("Admin hire handler is not configured");
      return;
    }
    onAdminComplete({
      values: {
        name: fullName.trim(),
        email: email.trim(),
        phone: mobilePhone.trim(),
        role,
        branchId,
        joiningDate,
        employmentType,
        offeredSalary: offeredSalary ? Number(offeredSalary) : undefined,
        probationMonths: Number(probationMonths) || 3,
      },
      employeeFile: withDocs,
      signature,
      jobApplication,
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-100 bg-brand-50/40 px-4 py-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{schoolName}</p>
        <h2 className="font-heading text-lg font-bold text-heading">Employee Application Form</h2>
        <p className="text-[11px] text-muted">SDLC Job Employee Application · photocopies / scans only for attachments</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold",
              step === s.id
                ? "border-brand-500 bg-brand-50 text-brand-800"
                : step > s.id
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-[#F1F3F5] bg-surface text-muted"
            )}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] ring-1 ring-current">
              {step > s.id ? <Check className="h-3 w-3" /> : s.id}
            </span>
            {s.short}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Section title="Personal details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={errors.fullName}>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Field>
            <Field label="CNIC" error={errors.cnic}>
              <Input value={cnic} onChange={(e) => setCnic(e.target.value)} placeholder="XXXXX-XXXXXXX-X" />
            </Field>
            <Field label="Designation">
              {isPublic ? (
                <Input value={designation} onChange={(e) => setDesignation(e.target.value)} />
              ) : (
                <Select
                  value={role}
                  onValueChange={(v) => {
                    setRole(v as StaffRole);
                    setDesignation(roleToDesignation(v as StaffRole));
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">Class Teacher / Co-Teacher</SelectItem>
                    <SelectItem value="therapist">Therapist</SelectItem>
                    <SelectItem value="admin">Administration</SelectItem>
                    <SelectItem value="support">Guard / Chef / Cleaning / Support</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </Field>
            <Field label="Branch">
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Father / Husband name (as per CNIC)" error={errors.fatherHusbandName}>
              <Input value={fatherHusbandName} onChange={(e) => setFatherHusbandName(e.target.value)} />
            </Field>
            <Field label="Date of birth" error={errors.dateOfBirth}>
              <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </Field>
            <Field label="Marital status" error={errors.maritalStatus}>
              <Select value={maritalStatus} onValueChange={(v) => setMaritalStatus(v as JobApplicationForm["maritalStatus"])}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Contact number (Home)">
              <Input value={homePhone} onChange={(e) => setHomePhone(e.target.value)} />
            </Field>
            <Field label="Contact number (Mobile)" error={errors.mobilePhone}>
              <Input value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address (Home)" error={errors.homeAddress}>
                <Textarea rows={2} value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Label>Passport-size photograph (do not staple)</Label>
              <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#DFE3E8] bg-[#F9FAFB] px-4 py-3 text-sm">
                <FileUp className="h-4 w-4 text-brand-600" />
                {passportPhotoName ? passportPhotoName : "Choose passport photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setPassportPhotoName(f.name);
                      setSlotFile("passport_photo", f.name);
                    }
                  }}
                />
              </label>
              {errors.passportPhotoName && <p className="mt-1 text-xs text-danger">{errors.passportPhotoName}</p>}
            </div>
          </div>
        </Section>
      )}

      {step === 2 && (
        <Section title="Education">
          <div className="space-y-3">
            {education.map((row, idx) => (
              <div key={row.level} className="grid gap-2 rounded-xl border border-[#F1F3F5] p-3 sm:grid-cols-4">
                <p className="text-xs font-semibold text-heading sm:col-span-4">{EDU_LABELS[row.level]}</p>
                <Input
                  placeholder="Institute name"
                  value={row.institute}
                  onChange={(e) =>
                    setEducation((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, institute: e.target.value } : r))
                    )
                  }
                />
                <Input
                  placeholder="Subject"
                  value={row.subject}
                  onChange={(e) =>
                    setEducation((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, subject: e.target.value } : r))
                    )
                  }
                />
                <Input
                  placeholder="Year"
                  value={row.year}
                  onChange={(e) =>
                    setEducation((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, year: e.target.value } : r))
                    )
                  }
                />
              </div>
            ))}
            {errors.education && <p className="text-xs text-danger">{errors.education}</p>}
          </div>
        </Section>
      )}

      {step === 3 && (
        <Section title="Work experience & additional courses">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Work experience</h4>
          <div className="space-y-3">
            {workExperience.map((row, idx) => (
              <div key={idx} className="grid gap-2 rounded-xl border border-[#F1F3F5] p-3 sm:grid-cols-2">
                <Input
                  placeholder="Company"
                  value={row.company}
                  onChange={(e) =>
                    setWorkExperience((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, company: e.target.value } : r))
                    )
                  }
                />
                <Input
                  placeholder="Job title"
                  value={row.jobTitle}
                  onChange={(e) =>
                    setWorkExperience((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, jobTitle: e.target.value } : r))
                    )
                  }
                />
                <Input
                  placeholder="Joining & leaving (mm/yy)"
                  value={row.joiningLeaving}
                  onChange={(e) =>
                    setWorkExperience((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, joiningLeaving: e.target.value } : r))
                    )
                  }
                />
                <Input
                  placeholder="Salary"
                  value={row.salary}
                  onChange={(e) =>
                    setWorkExperience((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, salary: e.target.value } : r))
                    )
                  }
                />
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setWorkExperience((prev) => [
                  ...prev,
                  { company: "", jobTitle: "", joiningLeaving: "", salary: "" },
                ])
              }
            >
              Add experience row
            </Button>
          </div>

          <h4 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted">Additional course</h4>
          <div className="space-y-3">
            {additionalCourses.map((row, idx) => (
              <div key={idx} className="grid gap-2 rounded-xl border border-[#F1F3F5] p-3 sm:grid-cols-2">
                <Input
                  placeholder="Title"
                  value={row.title}
                  onChange={(e) =>
                    setAdditionalCourses((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, title: e.target.value } : r))
                    )
                  }
                />
                <Input
                  placeholder="Institute"
                  value={row.institute}
                  onChange={(e) =>
                    setAdditionalCourses((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, institute: e.target.value } : r))
                    )
                  }
                />
                <Input
                  placeholder="Duration"
                  value={row.duration}
                  onChange={(e) =>
                    setAdditionalCourses((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, duration: e.target.value } : r))
                    )
                  }
                />
                <Input
                  placeholder="Date"
                  value={row.date}
                  onChange={(e) =>
                    setAdditionalCourses((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, date: e.target.value } : r))
                    )
                  }
                />
              </div>
            ))}
          </div>
        </Section>
      )}

      {step === 4 && (
        <Section title="Language skills, I.T. skills & references">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Language skills</h4>
          <div className="space-y-3">
            {languages.map((row, idx) => (
              <div key={row.language} className="grid gap-2 rounded-xl border border-[#F1F3F5] p-3 sm:grid-cols-4">
                <p className="self-center text-sm font-semibold capitalize">{row.language}</p>
                <SkillSelect
                  label="Written"
                  value={row.written}
                  onChange={(v) =>
                    setLanguages((prev) => prev.map((r, i) => (i === idx ? { ...r, written: v } : r)))
                  }
                />
                <SkillSelect
                  label="Spoken"
                  value={row.spoken}
                  onChange={(v) =>
                    setLanguages((prev) => prev.map((r, i) => (i === idx ? { ...r, spoken: v } : r)))
                  }
                />
                <SkillSelect
                  label="Understanding"
                  value={row.understanding}
                  onChange={(v) =>
                    setLanguages((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, understanding: v } : r))
                    )
                  }
                />
              </div>
            ))}
          </div>

          <h4 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted">I.T. skills</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {itSkills.map((row, idx) => (
              <div key={row.skill} className="flex items-center justify-between gap-3 rounded-xl border border-[#F1F3F5] px-3 py-2">
                <span className="text-sm font-medium">{row.skill}</span>
                <Select
                  value={row.level}
                  onValueChange={(v) =>
                    setItSkills((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, level: v as SkillLevel } : r))
                    )
                  }
                >
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strong">Strong</SelectItem>
                    <SelectItem value="weak">Weak</SelectItem>
                    <SelectItem value="nil">Nil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <h4 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted">Reference #1</h4>
          <RefFields value={reference1} onChange={setReference1} errors={{ name: errors.ref1, contact: errors.ref1c }} />
          <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">Reference #2</h4>
          <RefFields value={reference2} onChange={setReference2} errors={{ name: errors.ref2, contact: errors.ref2c }} />
        </Section>
      )}

      {step === 5 && (
        <Section title="Application questions">
          <Field label='What do you know about Dr. Sofia&apos;s Daycare and Learning School?' error={errors.knowAboutSdlc}>
            <Textarea rows={3} value={knowAboutSdlc} onChange={(e) => setKnowAboutSdlc(e.target.value)} />
          </Field>
          <Field label="Why do you think you are best suited for this job?" error={errors.whyBestSuited}>
            <Textarea rows={3} value={whyBestSuited} onChange={(e) => setWhyBestSuited(e.target.value)} />
          </Field>
          <Field label='What does the term "respect" mean to you?' error={errors.respectMeaning}>
            <Textarea rows={2} value={respectMeaning} onChange={(e) => setRespectMeaning(e.target.value)} />
          </Field>
          <Field label="How important is the use of technology in education today?" error={errors.techInEducation}>
            <Textarea rows={2} value={techInEducation} onChange={(e) => setTechInEducation(e.target.value)} />
          </Field>
          <Field label="Do you think that documentation is important in workplaces and why?" error={errors.documentationImportance}>
            <Textarea rows={2} value={documentationImportance} onChange={(e) => setDocumentationImportance(e.target.value)} />
          </Field>
        </Section>
      )}

      {step === 6 && (
        <Section title="Documents to be submitted (photocopies only)">
          <div className="mb-3 rounded-xl bg-brand-50/70 px-4 py-3">
            <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-heading">
              <FolderOpen className="h-4 w-4 text-brand-500" />
              Application checklist
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">{EMPLOYEE_FILE_INTRO}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="info">{slots.length} fields</Badge>
              <Badge variant="danger">{slots.filter((s) => s.requiredOnHire).length} compulsory</Badge>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {slots.map((slot) => (
              <EmployeeFileSlot
                key={slot.key}
                slot={slot}
                value={map[slot.key]?.fileName}
                received={map[slot.key]?.received}
                error={errors[`slot_${slot.key}`]}
                onFile={(n) => setSlotFile(slot.key, n)}
              />
            ))}
          </div>
          {errors.file && <p className="mt-2 text-xs text-danger">{errors.file}</p>}
        </Section>
      )}

      {step === 7 && (
        <Section title="Declaration & sign-off">
          {!isPublic && (
            <div className="mb-4 space-y-3 rounded-xl border border-[#F1F3F5] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">For official use</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Job hours">
                  <Input value={jobHours} onChange={(e) => setJobHours(e.target.value)} placeholder="e.g. 8:00–2:30" />
                </Field>
                <Field label="Joining date" error={errors.joiningDate}>
                  <Input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
                </Field>
                <Field label="Salary (PKR)">
                  <Input type="number" value={offeredSalary} onChange={(e) => setOfferedSalary(e.target.value)} />
                </Field>
                <Field label="Probation (months)" error={errors.probationMonths}>
                  <Input type="number" min={0} value={probationMonths} onChange={(e) => setProbationMonths(e.target.value)} />
                </Field>
                <Field label="Employment type">
                  <Select
                    value={employmentType}
                    onValueChange={(v) => setEmploymentType(v as "full_time" | "part_time" | "contract")}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full time</SelectItem>
                      <SelectItem value="part_time">Part time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="First interview date">
                  <Input type="date" value={firstInterviewDate} onChange={(e) => setFirstInterviewDate(e.target.value)} />
                </Field>
                <Field label="Demonstration date">
                  <Input type="date" value={demonstrationDate} onChange={(e) => setDemonstrationDate(e.target.value)} />
                </Field>
                <Field label="Training period">
                  <Input value={trainingPeriod} onChange={(e) => setTrainingPeriod(e.target.value)} placeholder="e.g. 2 weeks" />
                </Field>
                <Field label="Code">
                  <Input value={staffCode} onChange={(e) => setStaffCode(e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          <div className="max-h-40 overflow-y-auto rounded-xl border border-[#F1F3F5] bg-bg px-4 py-3 text-xs leading-relaxed text-muted">
            <p className="font-semibold text-heading">Applicant declaration</p>
            <p className="mt-2">
              I confirm that the information provided in this Employee Application Form is true and complete.
              I authorize {schoolName} to verify references and documents submitted with this application.
            </p>
          </div>
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={policiesAccepted}
              onChange={(e) => setPoliciesAccepted(e.target.checked)}
            />
            <span>I accept the declaration and authorize creation of my employee file.</span>
          </label>
          {errors.policies && <p className="text-xs text-danger">{errors.policies}</p>}
          <div className="mt-4">
            <Label>Applicant signature</Label>
            <div className="mt-2">
              <SignaturePad value={signature} onChange={setSignature} />
            </div>
            {errors.signature && <p className="mt-1 text-xs text-danger">{errors.signature}</p>}
          </div>
        </Section>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" disabled={step === 1} onClick={() => setStep((v) => Math.max(1, v - 1))}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        {step < 7 ? (
          <Button type="button" onClick={goNext}>
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" onClick={submit}>
            {isPublic ? "Submit application" : "Save & hire"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4 rounded-2xl bg-surface p-5 shadow-card">
      <h3 className="font-heading text-lg font-bold text-heading">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

function SkillSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: SkillLevel;
  onChange: (v: SkillLevel) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] text-muted">{label}</p>
      <Select value={value} onValueChange={(v) => onChange(v as SkillLevel)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="strong">Strong</SelectItem>
          <SelectItem value="weak">Weak</SelectItem>
          <SelectItem value="nil">Nil</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function RefFields({
  value,
  onChange,
  errors,
}: {
  value: ApplicationReference;
  onChange: (v: ApplicationReference) => void;
  errors: { name?: string; contact?: string };
}) {
  const set = (key: keyof ApplicationReference, v: string) => onChange({ ...value, [key]: v });
  return (
    <div className="grid gap-2 rounded-xl border border-[#F1F3F5] p-3 sm:grid-cols-2">
      <div>
        <Input placeholder="Name" value={value.name} onChange={(e) => set("name", e.target.value)} />
        {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
      </div>
      <Input placeholder="Relation" value={value.relation} onChange={(e) => set("relation", e.target.value)} />
      <Input placeholder="CNIC" value={value.cnic} onChange={(e) => set("cnic", e.target.value)} />
      <div>
        <Input placeholder="Contact #" value={value.contact} onChange={(e) => set("contact", e.target.value)} />
        {errors.contact && <p className="mt-1 text-xs text-danger">{errors.contact}</p>}
      </div>
      <Input placeholder="Occupation" value={value.occupation} onChange={(e) => set("occupation", e.target.value)} />
      <Input placeholder="Duration of relation" value={value.duration} onChange={(e) => set("duration", e.target.value)} />
    </div>
  );
}
