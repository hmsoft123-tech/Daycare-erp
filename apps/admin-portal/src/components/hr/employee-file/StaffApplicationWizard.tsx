"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, FolderOpen } from "lucide-react";
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
import type { EmployeeFileEntry, EmployeeFileSlotKey, StaffRole } from "@/types";
import { cn } from "@/lib/utils";
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
  }) => void;
  onAdminComplete?: (payload: {
    values: Prefill & { name: string; email: string; phone: string };
    employeeFile: EmployeeFileEntry[];
    signature: string;
  }) => void;
};

const STEPS = [
  { id: 1, title: "Personal details", short: "Personal" },
  { id: 2, title: "Role & offer", short: "Role" },
  { id: 3, title: "Employee file", short: "File" },
  { id: 4, title: "HR policies & sign", short: "Sign" },
];

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
  const [name, setName] = useState(prefill?.name ?? "");
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [phone, setPhone] = useState(prefill?.phone ?? "");
  const [cnic, setCnic] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [role, setRole] = useState<StaffRole>(prefill?.role ?? "teacher");
  const [branchId, setBranchId] = useState(prefill?.branchId ?? branches[0]?.id ?? "");
  const [employmentType, setEmploymentType] = useState<"full_time" | "part_time" | "contract">(
    prefill?.employmentType ?? "full_time"
  );
  const [joiningDate, setJoiningDate] = useState(prefill?.joiningDate ?? "");
  const [offeredSalary, setOfferedSalary] = useState(String(prefill?.offeredSalary ?? ""));
  const [probationMonths, setProbationMonths] = useState(String(prefill?.probationMonths ?? 3));
  const [experienceNote, setExperienceNote] = useState("");
  const [file, setFile] = useState<EmployeeFileEntry[]>(
    initialFile?.length ? initialFile : emptyEmployeeFile()
  );
  const [policiesAccepted, setPoliciesAccepted] = useState(false);
  const [signature, setSignature] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const map = entryMap(file);

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

  const validateStep = (s: number) => {
    const next: Record<string, string> = {};
    if (s === 1) {
      if (name.trim().length < 2) next.name = "Full name required";
      if (!email.includes("@")) next.email = "Valid email required";
      if (phone.trim().length < 10) next.phone = "Valid phone required";
      if (cnic.trim().length < 5) next.cnic = "CNIC number required";
      if (address.trim().length < 8) next.address = "Address required";
      if (emergencyName.trim().length < 2) next.emergencyName = "Emergency contact required";
      if (emergencyPhone.trim().length < 10) next.emergencyPhone = "Emergency phone required";
    }
    if (s === 2 && !isPublic) {
      if (!joiningDate) next.joiningDate = "Joining date required";
      const months = Number(probationMonths);
      if (Number.isNaN(months) || months < 0) next.probationMonths = "Valid probation months required";
    }
    if (s === 3) {
      // Staff ID card is generated on hire — not required as an upload in the wizard
      const missing = missingRequiredHire(file, isPublic ? "public" : "admin").filter(
        (m) => m.key !== "staff_id_card"
      );
      if (missing.length) {
        next.file = `Upload compulsory items: ${missing.map((m) => m.letter).join(", ")}`;
        for (const m of missing) next[`slot_${m.key}`] = "Required";
      }
    }
    if (s === 4) {
      if (!policiesAccepted) next.policies = "Accept HR policies to continue";
      if (signature.length < 20) next.signature = "Digital signature required";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((v) => Math.min(4, v + 1));
  };

  const submit = () => {
    if (!validateStep(4)) return;

    // Mark signed HR policies on file
    const withPolicies = mergeEmployeeFile(file, {
      signed_hr_policies: {
        received: true,
        fileName: "hr-policies-signed-digital.pdf",
        receivedAt: new Date().toISOString().slice(0, 10),
      },
      detailed_form: map.detailed_form.received
        ? map.detailed_form
        : {
            received: true,
            fileName: "employees-detailed-form-from-wizard.pdf",
            receivedAt: new Date().toISOString().slice(0, 10),
          },
    });

    if (isPublic && inviteToken) {
      completeHireInvite(inviteToken, {
        employeeFile: withPolicies,
        hrPoliciesSignature: signature,
        prefill: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role,
          branchId,
          joiningDate: joiningDate || undefined,
          employmentType,
          offeredSalary: offeredSalary ? Number(offeredSalary) : undefined,
        },
      });
      toast.success("Application submitted to HR");
      onPublicComplete?.({
        name: name.trim(),
        employeeFile: withPolicies,
        signature,
      });
      return;
    }

    if (!onAdminComplete) {
      toast.error("Admin hire handler is not configured");
      return;
    }
    onAdminComplete({
      values: {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        branchId,
        joiningDate,
        employmentType,
        offeredSalary: offeredSalary ? Number(offeredSalary) : undefined,
        probationMonths: Number(probationMonths) || 3,
      },
      employeeFile: withPolicies,
      signature,
    });
  };

  return (
    <div className="space-y-6">
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
        <div className="space-y-4 rounded-2xl bg-surface p-5 shadow-card">
          <h3 className="font-heading text-lg font-bold text-heading">Personal details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
              {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
              {errors.phone && <p className="mt-1 text-xs text-danger">{errors.phone}</p>}
            </div>
            <div>
              <Label htmlFor="cnic">CNIC number</Label>
              <Input id="cnic" className="mt-1" value={cnic} onChange={(e) => setCnic(e.target.value)} placeholder="XXXXX-XXXXXXX-X" />
              {errors.cnic && <p className="mt-1 text-xs text-danger">{errors.cnic}</p>}
            </div>
            <div>
              <Label htmlFor="emPhone">Emergency phone</Label>
              <Input id="emPhone" className="mt-1" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
              {errors.emergencyPhone && <p className="mt-1 text-xs text-danger">{errors.emergencyPhone}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="address">Residential address</Label>
              <Textarea id="address" className="mt-1" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
              {errors.address && <p className="mt-1 text-xs text-danger">{errors.address}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="emName">Emergency contact name</Label>
              <Input id="emName" className="mt-1" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
              {errors.emergencyName && <p className="mt-1 text-xs text-danger">{errors.emergencyName}</p>}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 rounded-2xl bg-surface p-5 shadow-card">
          <h3 className="font-heading text-lg font-bold text-heading">Role & offer</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as StaffRole)} disabled={isPublic && !!prefill?.role}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="therapist">Therapist</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="accountant">Accountant</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Branch</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Employment type</Label>
              <Select
                value={employmentType}
                onValueChange={(v) => setEmploymentType(v as "full_time" | "part_time" | "contract")}
              >
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full time</SelectItem>
                  <SelectItem value="part_time">Part time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="join">Joining date {isPublic ? "(if known)" : ""}</Label>
              <Input id="join" type="date" className="mt-1" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
              {errors.joiningDate && <p className="mt-1 text-xs text-danger">{errors.joiningDate}</p>}
            </div>
            {!isPublic && (
              <>
                <div>
                  <Label htmlFor="sal">Offered salary (PKR)</Label>
                  <Input id="sal" type="number" className="mt-1" value={offeredSalary} onChange={(e) => setOfferedSalary(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="probation">Probation (months)</Label>
                  <Input
                    id="probation"
                    type="number"
                    min={0}
                    className="mt-1"
                    value={probationMonths}
                    onChange={(e) => setProbationMonths(e.target.value)}
                  />
                  {errors.probationMonths && (
                    <p className="mt-1 text-xs text-danger">{errors.probationMonths}</p>
                  )}
                </div>
              </>
            )}
            <div className="sm:col-span-2">
              <Label htmlFor="exp">Experience / notes</Label>
              <Textarea id="exp" className="mt-1" rows={3} value={experienceNote} onChange={(e) => setExperienceNote(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 rounded-2xl bg-surface p-5 shadow-card">
          <div className="rounded-xl bg-brand-50/70 px-4 py-3">
            <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-heading">
              <FolderOpen className="h-4 w-4 text-brand-500" />
              Employee file — {isPublic ? "hiring documents only" : "all hire-phase documents"}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">{EMPLOYEE_FILE_INTRO}</p>
            <p className="mt-2 text-xs text-brand-800">
              {isPublic
                ? "Only documents needed at hiring are shown. HR will complete interview / induction annexes on the admin file."
                : "Admin view: all hire-phase slots including HR-only annexes. Compulsory items are marked."}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="info">{slots.length} fields</Badge>
              <Badge variant="danger">
                {slots.filter((s) => s.requiredOnHire).length} compulsory
              </Badge>
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
          {errors.file && <p className="text-xs text-danger">{errors.file}</p>}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 rounded-2xl bg-surface p-5 shadow-card">
          <h3 className="font-heading text-lg font-bold text-heading">HR policies & sign-off</h3>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-[#F1F3F5] bg-bg px-4 py-3 text-xs leading-relaxed text-muted">
            <p className="font-semibold text-heading">{schoolName} — Human Resource Policy acknowledgment</p>
            <p className="mt-2">
              I confirm that I have read (or will review with HR) the SDLC Human Resource Policy, that
              my employee file will be created under HR supervision, and that the documents I upload
              are true copies. Licensed to Dr. Sofia’s Daycare & Learning Center.
            </p>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={policiesAccepted}
              onChange={(e) => setPoliciesAccepted(e.target.checked)}
            />
            <span>I accept the HR policies and authorize creation of my employee file.</span>
          </label>
          {errors.policies && <p className="text-xs text-danger">{errors.policies}</p>}
          <div>
            <Label>Digital signature</Label>
            <div className="mt-2">
              <SignaturePad value={signature} onChange={setSignature} />
            </div>
            {errors.signature && <p className="mt-1 text-xs text-danger">{errors.signature}</p>}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={step === 1}
          onClick={() => setStep((v) => Math.max(1, v - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        {step < 4 ? (
          <Button type="button" onClick={goNext}>
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" onClick={submit}>
            {isPublic ? "Submit application" : "Save hire file"}
          </Button>
        )}
      </div>
    </div>
  );
}
