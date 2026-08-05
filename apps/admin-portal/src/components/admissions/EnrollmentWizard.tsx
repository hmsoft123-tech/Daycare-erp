"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { SignaturePad } from "@/components/admissions/SignaturePad";
import { IdCardPreviewModal } from "@/components/id-cards/IdCardPreviewModal";
import { EnrollmentInviteLinkModal } from "@/components/admissions/EnrollmentInviteLinkModal";
import { branches } from "@/data/branches";
import { classes, students } from "@/data/students";
import { issueStudentIdCard } from "@/lib/id-card-store";
import { generateStudentCardNumber } from "@/lib/id-card";
import {
  completeEnrollmentInvite,
  createEnrollmentInvite,
  type EnrollmentInvite,
} from "@/lib/enrollment-invite-store";
import { useTenantStore } from "@/lib/tenant-store";
import { SDLC_TERMS_AND_CONDITIONS } from "@/data/sdlc-terms";
import { formatCurrency, cn } from "@/lib/utils";
import { CLASS_GROUPS } from "@/data/services";
import {
  addonServices,
  extrasFromSelection,
  planAdmissionFee,
  planId,
  planLabel,
  planMonthlyTotal,
} from "@/lib/services-catalog";
import { requestEnrollmentFeeLock } from "@/lib/mock-service";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, FileUp, Upload } from "lucide-react";
import type { PortalIdCard, ServiceTier, Student } from "@/types";

const ALLERGY_OPTIONS = [
  "Peanuts",
  "Tree nuts",
  "Dairy",
  "Eggs",
  "Gluten",
  "Seafood",
  "Medication",
  "Other",
] as const;

const CARE_TIERS: { id: ServiceTier; label: string; hint: string }[] = [
  { id: "base", label: "Base", hint: "Standard class hours" },
  { id: "lite", label: "Lite", hint: "Extra care 1–4 hrs (ASC 1–3 hrs)" },
  { id: "plus", label: "Plus", hint: "Extra care 1–8 hrs (ASC 1–7 hrs)" },
  { id: "pro", label: "Pro", hint: "Full-day extended (Infant–KG)" },
];

const CATALOGUE_ADDONS = addonServices();

const DOC_SLOTS = [
  {
    key: "passportPhotos",
    label: "5 Passport-size photographs",
    hint: "Name written on the back in CAPITAL LETTERS (upload clear scans/photos)",
  },
  { key: "fatherCnic", label: "Father CNIC photocopy", hint: "1 photocopy / clear scan" },
  { key: "motherCnic", label: "Mother CNIC photocopy", hint: "1 photocopy / clear scan" },
  { key: "familyPhoto", label: "Family photograph", hint: "1 family photo" },
  { key: "birthCertificate", label: "Child’s B-Form / Birth Certificate", hint: "Required for enrollment" },
  { key: "utilityBill", label: "Residential address electricity bill", hint: "Recent utility bill" },
] as const;

const enrollmentSchema = z.object({
  // Step 1
  childFullName: z.string().min(2, "Child's full name required"),
  dob: z.string().min(1, "Date of birth required"),
  gender: z.enum(["male", "female", "other"]),
  nationality: z.string().min(2, "Nationality required"),
  childIdNumber: z.string().min(1, "Identification / registration number required"),
  previousSchool: z.string().optional(),
  passportPhotoName: z.string().min(1, "Child passport photo required"),
  // Step 2
  fatherName: z.string().min(2, "Father / Guardian 1 name required"),
  fatherPhone: z.string().min(10, "Valid mobile required"),
  fatherCnic: z.string().min(5, "Father National ID / CNIC required"),
  fatherOccupation: z.string().optional(),
  fatherEmail: z.string().email("Valid email required"),
  motherName: z.string().min(2, "Mother / Guardian 2 name required"),
  motherPhone: z.string().min(10, "Valid mobile required"),
  motherCnic: z.string().min(5, "Mother National ID / CNIC required"),
  motherOccupation: z.string().optional(),
  motherEmail: z.string().email("Valid email required"),
  residentialAddress: z.string().min(10, "Primary residential address required"),
  emergencyName: z.string().min(2, "Emergency contact name required"),
  emergencyRelation: z.string().min(2, "Relationship required"),
  emergencyPhone: z.string().min(10, "Emergency phone required"),
  emergencyId: z.string().optional(),
  // Step 3
  allergies: z.array(z.string()),
  allergyDetails: z.string().optional(),
  specialNeeds: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  medicalAuthorization: z.boolean().refine((v) => v === true, "Medical authorization required"),
  // Step 4
  joiningDate: z.string().min(1, "Target joining date required"),
  branchId: z.string().min(1, "Branch required"),
  classGroup: z.string().min(1, "Select a class"),
  careTier: z.enum(["base", "lite", "plus", "pro"]),
  addOns: z.array(z.string()),
  completionMode: z.enum(["invite_to_pay", "mark_enrolled"]),
  // Step 5
  docPassportPhotos: z.string().min(1, "Passport photographs required"),
  docFatherCnic: z.string().min(1, "Father CNIC copy required"),
  docMotherCnic: z.string().min(1, "Mother CNIC copy required"),
  docFamilyPhoto: z.string().min(1, "Family photograph required"),
  docBirthCertificate: z.string().min(1, "B-Form / Birth Certificate required"),
  docUtilityBill: z.string().min(1, "Electricity / utility bill required"),
  termsAccepted: z.boolean().refine((v) => v === true, "Accept terms to continue"),
  signatureDataUrl: z.string().min(20, "Parent digital signature required"),
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

const STEPS = [
  { id: 1, title: "Child Profile", short: "Child" },
  { id: 2, title: "Parents & Emergency", short: "Parents" },
  { id: 3, title: "Medical & Daily Care", short: "Medical" },
  { id: 4, title: "Program & Fees", short: "Program" },
  { id: 5, title: "Documents & Sign-Off", short: "Docs" },
];

const TERMS_TEXT = SDLC_TERMS_AND_CONDITIONS;

function FileSlot({
  label,
  hint,
  value,
  onFile,
  error,
}: {
  label: string;
  hint: string;
  value?: string;
  onFile: (name: string) => void;
  error?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[#DFE3E8] bg-[#F9FAFB] p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-white p-2 text-brand-600 ring-1 ring-brand-100">
          <Upload className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-heading">{label}</p>
          <p className="mt-0.5 text-xs text-muted">{hint}</p>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50">
            <FileUp className="h-3.5 w-3.5" />
            {value ? "Replace file" : "Choose file"}
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f.name);
              }}
            />
          </label>
          {value && <p className="mt-2 truncate text-xs font-medium text-heading">{value}</p>}
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
      </div>
    </div>
  );
}

type EnrollmentWizardProps = {
  /** admin = staff CRM wizard; public = tokenized parent invite page */
  mode?: "admin" | "public";
  inviteToken?: string;
  prefill?: Partial<EnrollmentFormData>;
  schoolName?: string;
  onPublicComplete?: (payload: { childName: string }) => void;
};

export function EnrollmentWizard({
  mode = "admin",
  inviteToken,
  prefill,
  schoolName = "Kinder Pilot",
  onPublicComplete,
}: EnrollmentWizardProps) {
  const isPublic = mode === "public";
  const [step, setStep] = useState(1);
  const [issuedCard, setIssuedCard] = useState<PortalIdCard | null>(null);
  const [inviteModal, setInviteModal] = useState<EnrollmentInvite | null>(null);

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      childFullName: "",
      dob: "",
      gender: "male",
      nationality: "Pakistani",
      childIdNumber: "",
      previousSchool: "",
      passportPhotoName: "",
      fatherName: "",
      fatherPhone: "",
      fatherCnic: "",
      fatherOccupation: "",
      fatherEmail: "",
      motherName: "",
      motherPhone: "",
      motherCnic: "",
      motherOccupation: "",
      motherEmail: "",
      residentialAddress: "",
      emergencyName: "",
      emergencyRelation: "",
      emergencyPhone: "",
      emergencyId: "",
      allergies: [],
      allergyDetails: "",
      specialNeeds: "",
      dietaryRestrictions: "",
      medicalAuthorization: false,
      joiningDate: "",
      branchId: "",
      classGroup: "",
      careTier: "base",
      addOns: [],
      completionMode: isPublic ? "mark_enrolled" : "mark_enrolled",
      docPassportPhotos: "",
      docFatherCnic: "",
      docMotherCnic: "",
      docFamilyPhoto: "",
      docBirthCertificate: "",
      docUtilityBill: "",
      termsAccepted: false,
      signatureDataUrl: "",
      ...prefill,
    },
    mode: "onChange",
  });

  const tenantSlug = useTenantStore((s) => s.tenantSlug) ?? "kinder-pilot";

  const { register, watch, setValue, trigger, formState: { errors } } = form;
  const values = watch();

  const feeSummary = useMemo(() => {
    const group = values.classGroup || "";
    const tier = (values.careTier || "base") as ServiceTier;
    const admission = group ? planAdmissionFee(group, tier) : 0;
    const tuition = group ? planMonthlyTotal(group, tier) : 0;
    const addOnTotal = CATALOGUE_ADDONS.filter((a) => values.addOns?.includes(a.id)).reduce(
      (sum, a) => sum + (a.monthlyFee || a.registrationFee || 0),
      0
    );
    return {
      admission,
      tuition,
      addOnTotal,
      monthly: tuition + addOnTotal,
      firstPayment: admission + tuition + addOnTotal,
      label: group ? planLabel(group, tier) : "",
    };
  }, [values.classGroup, values.careTier, values.addOns]);

  const stepFields: (keyof EnrollmentFormData)[][] = [
    ["childFullName", "dob", "gender", "nationality", "childIdNumber", "passportPhotoName"],
    [
      "fatherName",
      "fatherPhone",
      "fatherCnic",
      "fatherEmail",
      "motherName",
      "motherPhone",
      "motherCnic",
      "motherEmail",
      "residentialAddress",
      "emergencyName",
      "emergencyRelation",
      "emergencyPhone",
    ],
    ["medicalAuthorization"],
    ["joiningDate", "branchId", "classGroup", "careTier", "completionMode"],
    [
      "docPassportPhotos",
      "docFatherCnic",
      "docMotherCnic",
      "docFamilyPhoto",
      "docBirthCertificate",
      "docUtilityBill",
      "termsAccepted",
      "signatureDataUrl",
    ],
  ];

  const nextStep = async () => {
    const valid = await trigger(stepFields[step - 1]);
    if (valid) setStep((s) => Math.min(s + 1, 5));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const toggleAllergy = (item: string) => {
    const current = values.allergies ?? [];
    setValue(
      "allergies",
      current.includes(item) ? current.filter((a) => a !== item) : [...current, item],
      { shouldValidate: true }
    );
  };

  const toggleAddon = (id: string) => {
    const current = values.addOns ?? [];
    let next = current.includes(id) ? current.filter((a) => a !== id) : [...current, id];
    // Meal A/B exclusive
    if (id === "svc-meal-a") next = next.filter((a) => a !== "svc-meal-b");
    if (id === "svc-meal-b") next = next.filter((a) => a !== "svc-meal-a");
    setValue("addOns", next, { shouldValidate: true });
  };

  const onSubmit = form.handleSubmit(async (data) => {
    // Admin: send secure public enroll link (backend will email this later)
    if (!isPublic && data.completionMode === "invite_to_pay") {
      const invite = createEnrollmentInvite({
        email: data.fatherEmail || data.motherEmail,
        parentName: data.fatherName || data.motherName,
        tenantSlug,
        prefill: {
          childFullName: data.childFullName,
          fatherName: data.fatherName,
          fatherEmail: data.fatherEmail,
          fatherPhone: data.fatherPhone,
          motherName: data.motherName,
          motherEmail: data.motherEmail,
          motherPhone: data.motherPhone,
          branchId: data.branchId,
          classGroup: data.classGroup,
          careTier: data.careTier,
          servicePlanId: planId(data.classGroup, data.careTier),
          mainProgram: planId(data.classGroup, data.careTier),
        },
      });
      setInviteModal(invite);
      toast.success("Secure enrollment invite created — copy the link to share (email in production)");
      return;
    }

    const parts = data.childFullName.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ") || parts[0];
    const id = `s-${Date.now()}`;
    const cardNumber = generateStudentCardNumber(id);
    const label = planLabel(data.classGroup, data.careTier);
    const room = classes.find((c) => c.classGroup === data.classGroup);
    const student: Student = {
      id,
      firstName,
      lastName,
      dob: data.dob,
      bloodGroup: "N/A",
      allergies: data.allergies,
      branchId: data.branchId,
      classId: room?.id ?? "c1",
      className: room?.name ?? label,
      enrollmentDate: data.joiningDate || new Date().toISOString().slice(0, 10),
      status: "active",
      parentIds: [],
      feePlan: label,
      servicePlanId: planId(data.classGroup, data.careTier),
      extras: extrasFromSelection(data.classGroup, data.careTier, data.addOns),
      gender: data.gender === "other" ? "male" : data.gender,
      idCardNumber: isPublic ? undefined : cardNumber,
    };

    // Public enrollments need HO fee-lock approval before pending payment
    if (isPublic) {
      const lock = await requestEnrollmentFeeLock({
        student,
        monthlyTuition: planMonthlyTotal(data.classGroup, data.careTier),
        admissionFee: planAdmissionFee(data.classGroup, data.careTier),
        feeNotes: `Online enrollment · ${label}`,
        requestedBy: "Online enrollment",
      });
      if (!lock.ok) {
        toast.error(lock.error);
        return;
      }
      if (inviteToken) completeEnrollmentInvite(inviteToken);
      toast.success(
        "Enrollment submitted — Head Office must approve fee lock before pending payment"
      );
      onPublicComplete?.({ childName: data.childFullName });
      return;
    }

    students.unshift(student);
    const card = await issueStudentIdCard(student.id);
    toast.success(`Enrollment saved — ID card ${cardNumber} generated`);
    setIssuedCard(card);
    setStep(1);
    form.reset();
  });

  return (
    <div className="mx-auto max-w-6xl">
      {isPublic && (
        <div className="mb-6 rounded-2xl border border-brand-100 bg-brand-50/50 px-5 py-4">
          <p className="text-sm font-semibold text-brand-800">{schoolName} · Secure enrollment</p>
          <p className="mt-1 text-xs text-muted">
            This form was opened from a unique emailed invite. Do not share this link. Your session is
            validated by a secure token.
          </p>
        </div>
      )}

      {!isPublic && (
      <Card className="mb-6 border-brand-100 bg-brand-50/40">
        <CardContent className="p-5">
          <h3 className="font-heading text-sm font-bold text-heading">Required documents checklist</h3>
          <ul className="mt-2 grid gap-1 text-xs text-muted sm:grid-cols-2">
            <li>1. 5 passport-size photographs (name on back in CAPITAL LETTERS)</li>
            <li>2. 1 photocopy of Mother’s CNIC</li>
            <li>3. 1 photocopy of Father’s CNIC</li>
            <li>4. 1 family photograph</li>
            <li>5. Child’s B-Form / Birth Certificate</li>
            <li>6. Residential address electricity bill</li>
          </ul>
          <p className="mt-2 text-[11px] text-muted">~4–6 minutes · 5 steps · mobile & desktop</p>
        </CardContent>
      </Card>
      )}

      {isPublic && (
        <Card className="mb-6 border-brand-100 bg-brand-50/40">
          <CardContent className="p-5">
            <h3 className="font-heading text-sm font-bold text-heading">Please prepare these documents</h3>
            <ul className="mt-2 grid gap-1 text-xs text-muted sm:grid-cols-2">
              <li>1. 5 passport-size photographs (name on back in CAPITAL LETTERS)</li>
              <li>2. 1 photocopy of Mother’s CNIC</li>
              <li>3. 1 photocopy of Father’s CNIC</li>
              <li>4. 1 family photograph</li>
              <li>5. Child’s B-Form / Birth Certificate</li>
              <li>6. Residential address electricity bill</li>
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Enrollment steps
          </p>
          <ol className="space-y-1">
            {STEPS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setStep(s.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                    step === s.id
                      ? "bg-brand-50 font-semibold text-brand-700 ring-1 ring-brand-200"
                      : step > s.id
                        ? "text-heading hover:bg-bg"
                        : "text-muted hover:bg-bg"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      step > s.id
                        ? "bg-emerald-500 text-white"
                        : step === s.id
                          ? "bg-brand-500 text-white"
                          : "bg-bg text-muted"
                    )}
                  >
                    {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
                  </span>
                  <span className="hidden sm:inline">{s.title}</span>
                  <span className="sm:hidden">{s.short}</span>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  {step === 1 && (
                    <>
                      <div>
                        <h2 className="font-heading text-lg font-bold text-heading">Child profile</h2>
                        <p className="text-sm text-muted">Core identity of the student</p>
                      </div>
                      <div>
                        <Label htmlFor="childFullName">Child&apos;s full name</Label>
                        <Input id="childFullName" className="mt-1" {...register("childFullName")} />
                        {errors.childFullName && (
                          <p className="mt-1 text-xs text-danger">{errors.childFullName.message}</p>
                        )}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="dob">Date of birth</Label>
                          <Input id="dob" type="date" className="mt-1" {...register("dob")} />
                          {errors.dob && <p className="mt-1 text-xs text-danger">{errors.dob.message}</p>}
                        </div>
                        <div>
                          <Label>Gender</Label>
                          <Select
                            value={values.gender}
                            onValueChange={(v) => setValue("gender", v as EnrollmentFormData["gender"])}
                          >
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="nationality">Nationality</Label>
                          <Input id="nationality" className="mt-1" {...register("nationality")} />
                          {errors.nationality && (
                            <p className="mt-1 text-xs text-danger">{errors.nationality.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="childIdNumber">Child ID / B-Form / Registration no.</Label>
                          <Input id="childIdNumber" className="mt-1" {...register("childIdNumber")} />
                          {errors.childIdNumber && (
                            <p className="mt-1 text-xs text-danger">{errors.childIdNumber.message}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="previousSchool">Previous school / daycare (optional)</Label>
                        <Input id="previousSchool" className="mt-1" {...register("previousSchool")} />
                      </div>
                      <FileSlot
                        label="Child's passport photo"
                        hint="Digital passport-size photo upload"
                        value={values.passportPhotoName}
                        onFile={(name) => setValue("passportPhotoName", name, { shouldValidate: true })}
                        error={errors.passportPhotoName?.message}
                      />
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div>
                        <h2 className="font-heading text-lg font-bold text-heading">Parents & emergency</h2>
                        <p className="text-sm text-muted">Primary / secondary contacts and authorized pickup</p>
                      </div>
                      <div className="rounded-2xl border border-[#F1F3F5] p-4">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
                          Father / Guardian 1
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label>Full name</Label>
                            <Input className="mt-1" {...register("fatherName")} />
                            {errors.fatherName && (
                              <p className="mt-1 text-xs text-danger">{errors.fatherName.message}</p>
                            )}
                          </div>
                          <div>
                            <Label>Mobile</Label>
                            <Input className="mt-1" {...register("fatherPhone")} />
                            {errors.fatherPhone && (
                              <p className="mt-1 text-xs text-danger">{errors.fatherPhone.message}</p>
                            )}
                          </div>
                          <div>
                            <Label>National ID / CNIC</Label>
                            <Input className="mt-1" {...register("fatherCnic")} />
                            {errors.fatherCnic && (
                              <p className="mt-1 text-xs text-danger">{errors.fatherCnic.message}</p>
                            )}
                          </div>
                          <div>
                            <Label>Occupation</Label>
                            <Input className="mt-1" {...register("fatherOccupation")} />
                          </div>
                          <div className="sm:col-span-2">
                            <Label>Email</Label>
                            <Input type="email" className="mt-1" {...register("fatherEmail")} />
                            {errors.fatherEmail && (
                              <p className="mt-1 text-xs text-danger">{errors.fatherEmail.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[#F1F3F5] p-4">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
                          Mother / Guardian 2
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label>Full name</Label>
                            <Input className="mt-1" {...register("motherName")} />
                            {errors.motherName && (
                              <p className="mt-1 text-xs text-danger">{errors.motherName.message}</p>
                            )}
                          </div>
                          <div>
                            <Label>Mobile</Label>
                            <Input className="mt-1" {...register("motherPhone")} />
                            {errors.motherPhone && (
                              <p className="mt-1 text-xs text-danger">{errors.motherPhone.message}</p>
                            )}
                          </div>
                          <div>
                            <Label>National ID / CNIC</Label>
                            <Input className="mt-1" {...register("motherCnic")} />
                            {errors.motherCnic && (
                              <p className="mt-1 text-xs text-danger">{errors.motherCnic.message}</p>
                            )}
                          </div>
                          <div>
                            <Label>Occupation</Label>
                            <Input className="mt-1" {...register("motherOccupation")} />
                          </div>
                          <div className="sm:col-span-2">
                            <Label>Email</Label>
                            <Input type="email" className="mt-1" {...register("motherEmail")} />
                            {errors.motherEmail && (
                              <p className="mt-1 text-xs text-danger">{errors.motherEmail.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label>Primary residential address</Label>
                        <Textarea className="mt-1" rows={3} {...register("residentialAddress")} />
                        {errors.residentialAddress && (
                          <p className="mt-1 text-xs text-danger">{errors.residentialAddress.message}</p>
                        )}
                      </div>
                      <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-orange-800">
                          Emergency contact & authorized pickup
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label>Full name</Label>
                            <Input className="mt-1" {...register("emergencyName")} />
                            {errors.emergencyName && (
                              <p className="mt-1 text-xs text-danger">{errors.emergencyName.message}</p>
                            )}
                          </div>
                          <div>
                            <Label>Relationship</Label>
                            <Input className="mt-1" {...register("emergencyRelation")} />
                            {errors.emergencyRelation && (
                              <p className="mt-1 text-xs text-danger">{errors.emergencyRelation.message}</p>
                            )}
                          </div>
                          <div>
                            <Label>Phone</Label>
                            <Input className="mt-1" {...register("emergencyPhone")} />
                            {errors.emergencyPhone && (
                              <p className="mt-1 text-xs text-danger">{errors.emergencyPhone.message}</p>
                            )}
                          </div>
                          <div>
                            <Label>National ID / Photo ID (optional)</Label>
                            <Input className="mt-1" {...register("emergencyId")} />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <div>
                        <h2 className="font-heading text-lg font-bold text-heading">Medical & daily care</h2>
                        <p className="text-sm text-muted">Health regulations and care guidelines</p>
                      </div>
                      <div>
                        <Label>Allergies & medical conditions</Label>
                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {ALLERGY_OPTIONS.map((opt) => (
                            <label
                              key={opt}
                              className={cn(
                                "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs",
                                values.allergies?.includes(opt)
                                  ? "border-brand-500 bg-brand-50 text-brand-800"
                                  : "border-[#DFE3E8] bg-white"
                              )}
                            >
                              <Checkbox
                                checked={values.allergies?.includes(opt)}
                                onCheckedChange={() => toggleAllergy(opt)}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                        <Textarea
                          className="mt-3"
                          rows={2}
                          placeholder="Additional allergy / medical details"
                          {...register("allergyDetails")}
                        />
                      </div>
                      <div>
                        <Label>Disabilities or special needs (optional)</Label>
                        <Textarea className="mt-1" rows={3} {...register("specialNeeds")} />
                      </div>
                      <div>
                        <Label>Dietary restrictions / meal preferences</Label>
                        <Input className="mt-1" placeholder="e.g. No pork, vegetarian" {...register("dietaryRestrictions")} />
                      </div>
                      <label className="flex items-start gap-3 rounded-xl border border-[#F1F3F5] p-4">
                        <Checkbox
                          checked={values.medicalAuthorization}
                          onCheckedChange={(c) =>
                            setValue("medicalAuthorization", c === true, { shouldValidate: true })
                          }
                        />
                        <span className="text-sm text-heading">
                          Emergency medical authorization — I authorize the center to seek emergency medical
                          care if I cannot be reached.
                          {errors.medicalAuthorization && (
                            <span className="mt-1 block text-xs text-danger">
                              {errors.medicalAuthorization.message}
                            </span>
                          )}
                        </span>
                      </label>
                    </>
                  )}

                  {step === 4 && (
                    <>
                      <div>
                        <h2 className="font-heading text-lg font-bold text-heading">Class, care tier & plus services</h2>
                        <p className="text-sm text-muted">
                          SDLC 2026–2027 — Base class + Lite/Plus/Pro extra care, then optional plus services
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="joiningDate">Target joining date</Label>
                          <Input id="joiningDate" type="date" className="mt-1" {...register("joiningDate")} />
                          {errors.joiningDate && (
                            <p className="mt-1 text-xs text-danger">{errors.joiningDate.message}</p>
                          )}
                        </div>
                        <div>
                          <Label>Branch</Label>
                          <Select
                            value={values.branchId}
                            onValueChange={(v) => setValue("branchId", v, { shouldValidate: true })}
                          >
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Select branch" /></SelectTrigger>
                            <SelectContent>
                              {branches.map((b) => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.branchId && (
                            <p className="mt-1 text-xs text-danger">{errors.branchId.message}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label>Class / program</Label>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {CLASS_GROUPS.map((g) => {
                            const tier = (values.careTier || "base") as ServiceTier;
                            const effectiveTier: ServiceTier =
                              g.id === "after_school" && (tier === "base" || tier === "pro")
                                ? "lite"
                                : tier;
                            return (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => {
                                  setValue("classGroup", g.id, { shouldValidate: true });
                                  if (g.id === "after_school" && (values.careTier === "base" || values.careTier === "pro")) {
                                    setValue("careTier", "lite", { shouldValidate: true });
                                  }
                                }}
                                className={cn(
                                  "rounded-xl border p-3 text-left transition",
                                  values.classGroup === g.id
                                    ? "border-brand-500 bg-brand-50 ring-1 ring-brand-200"
                                    : "border-[#DFE3E8] hover:border-brand-200"
                                )}
                              >
                                <p className="text-sm font-semibold text-heading">{g.label}</p>
                                <p className="text-[11px] text-muted">{g.ageBand}</p>
                                <p className="mt-1 text-[11px] text-muted">
                                  Adm {formatCurrency(planAdmissionFee(g.id, effectiveTier))} · Mo{" "}
                                  {formatCurrency(planMonthlyTotal(g.id, effectiveTier))}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                        {errors.classGroup && (
                          <p className="mt-1 text-xs text-danger">{errors.classGroup.message}</p>
                        )}
                      </div>
                      <div>
                        <Label>Care tier (Lite / Plus / Pro)</Label>
                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {CARE_TIERS.map((t) => {
                            const disabled =
                              values.classGroup === "after_school" &&
                              (t.id === "base" || t.id === "pro");
                            return (
                              <button
                                key={t.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => setValue("careTier", t.id, { shouldValidate: true })}
                                className={cn(
                                  "rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40",
                                  values.careTier === t.id
                                    ? "border-brand-500 bg-brand-50 ring-1 ring-brand-200"
                                    : "border-[#DFE3E8] hover:border-brand-200"
                                )}
                              >
                                <p className="text-sm font-semibold text-heading">{t.label}</p>
                                <p className="mt-0.5 text-[10px] text-muted">{t.hint}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <Label>Plus services & extras</Label>
                        <p className="mt-0.5 text-xs text-muted">
                          Meals, Quran, Saturdays, tuition, recreational, outsider registration
                        </p>
                        <div className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
                          {CATALOGUE_ADDONS.map((a) => (
                            <label
                              key={a.id}
                              className={cn(
                                "flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-sm",
                                values.addOns?.includes(a.id)
                                  ? "border-brand-500 bg-brand-50"
                                  : "border-[#DFE3E8]"
                              )}
                            >
                              <span className="flex items-center gap-2">
                                <Checkbox
                                  checked={values.addOns?.includes(a.id)}
                                  onCheckedChange={() => toggleAddon(a.id)}
                                />
                                <span>
                                  {a.name}
                                  {a.category !== "value_added" && (
                                    <span className="mt-0.5 block text-[10px] capitalize text-muted">
                                      {a.category.replace("_", " ")}
                                    </span>
                                  )}
                                </span>
                              </span>
                              <span className="shrink-0 text-xs text-muted">
                                {a.monthlyFee > 0
                                  ? `+${formatCurrency(a.monthlyFee)}/mo`
                                  : a.registrationFee
                                    ? `Reg ${formatCurrency(a.registrationFee)}`
                                    : "—"}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-brand-800">Fee summary</p>
                        {feeSummary.label && (
                          <p className="mt-1 text-sm font-semibold text-heading">{feeSummary.label}</p>
                        )}
                        <dl className="mt-3 space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-muted">Admission fee</dt>
                            <dd className="font-medium">{formatCurrency(feeSummary.admission)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted">Monthly (class + care tier)</dt>
                            <dd className="font-medium">{formatCurrency(feeSummary.tuition)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted">Add-ons</dt>
                            <dd className="font-medium">{formatCurrency(feeSummary.addOnTotal)}</dd>
                          </div>
                          <div className="flex justify-between border-t border-brand-200 pt-2 font-bold text-heading">
                            <dt>First payment total</dt>
                            <dd>{formatCurrency(feeSummary.firstPayment)}</dd>
                          </div>
                          <div className="flex justify-between text-xs text-muted">
                            <dt>Ongoing monthly</dt>
                            <dd>{formatCurrency(feeSummary.monthly)}</dd>
                          </div>
                        </dl>
                      </div>
                      {!isPublic && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label
                          className={cn(
                            "cursor-pointer rounded-xl border p-4",
                            values.completionMode === "invite_to_pay"
                              ? "border-brand-500 bg-brand-50"
                              : "border-[#DFE3E8]"
                          )}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            checked={values.completionMode === "invite_to_pay"}
                            onChange={() => setValue("completionMode", "invite_to_pay")}
                          />
                          <p className="font-semibold text-heading">Invite parent to complete</p>
                          <p className="mt-1 text-xs text-muted">
                            Creates a secure /enroll/[token] link (emailed by backend in production)
                          </p>
                        </label>
                        <label
                          className={cn(
                            "cursor-pointer rounded-xl border p-4",
                            values.completionMode === "mark_enrolled"
                              ? "border-brand-500 bg-brand-50"
                              : "border-[#DFE3E8]"
                          )}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            checked={values.completionMode === "mark_enrolled"}
                            onChange={() => setValue("completionMode", "mark_enrolled")}
                          />
                          <p className="font-semibold text-heading">Mark enrolled now</p>
                          <p className="mt-1 text-xs text-muted">Save to portal + generate student ID card</p>
                        </label>
                      </div>
                      )}
                      {isPublic && (
                        <p className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-xs text-muted">
                          After you submit, the school confirms payment and issues your child&apos;s ID card.
                        </p>
                      )}
                    </>
                  )}

                  {step === 5 && (
                    <>
                      <div>
                        <h2 className="font-heading text-lg font-bold text-heading">Documents & digital sign-off</h2>
                        <p className="text-sm text-muted">Upload checklist items and parent e-signature</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <FileSlot
                          label={DOC_SLOTS[0].label}
                          hint={DOC_SLOTS[0].hint}
                          value={values.docPassportPhotos}
                          onFile={(n) => setValue("docPassportPhotos", n, { shouldValidate: true })}
                          error={errors.docPassportPhotos?.message}
                        />
                        <FileSlot
                          label={DOC_SLOTS[1].label}
                          hint={DOC_SLOTS[1].hint}
                          value={values.docFatherCnic}
                          onFile={(n) => setValue("docFatherCnic", n, { shouldValidate: true })}
                          error={errors.docFatherCnic?.message}
                        />
                        <FileSlot
                          label={DOC_SLOTS[2].label}
                          hint={DOC_SLOTS[2].hint}
                          value={values.docMotherCnic}
                          onFile={(n) => setValue("docMotherCnic", n, { shouldValidate: true })}
                          error={errors.docMotherCnic?.message}
                        />
                        <FileSlot
                          label={DOC_SLOTS[3].label}
                          hint={DOC_SLOTS[3].hint}
                          value={values.docFamilyPhoto}
                          onFile={(n) => setValue("docFamilyPhoto", n, { shouldValidate: true })}
                          error={errors.docFamilyPhoto?.message}
                        />
                        <FileSlot
                          label={DOC_SLOTS[4].label}
                          hint={DOC_SLOTS[4].hint}
                          value={values.docBirthCertificate}
                          onFile={(n) => setValue("docBirthCertificate", n, { shouldValidate: true })}
                          error={errors.docBirthCertificate?.message}
                        />
                        <FileSlot
                          label={DOC_SLOTS[5].label}
                          hint={DOC_SLOTS[5].hint}
                          value={values.docUtilityBill}
                          onFile={(n) => setValue("docUtilityBill", n, { shouldValidate: true })}
                          error={errors.docUtilityBill?.message}
                        />
                      </div>
                      <div>
                        <Label>Terms & conditions</Label>
                        <div className="mt-1 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl border border-[#DFE3E8] bg-[#F9FAFB] p-4 text-xs leading-relaxed text-muted">
                          {TERMS_TEXT}
                        </div>
                        <label className="mt-3 flex items-start gap-3">
                          <Checkbox
                            checked={values.termsAccepted}
                            onCheckedChange={(c) =>
                              setValue("termsAccepted", c === true, { shouldValidate: true })
                            }
                          />
                          <span className="text-sm text-heading">
                            I have read and agree to the center policies above.
                            {errors.termsAccepted && (
                              <span className="mt-1 block text-xs text-danger">
                                {errors.termsAccepted.message}
                              </span>
                            )}
                          </span>
                        </label>
                      </div>
                      <div>
                        <Label>Parent digital signature</Label>
                        <p className="mb-2 text-xs text-muted">
                          Sign with mouse or touch. Timestamp is recorded on submit.
                        </p>
                        <SignaturePad
                          value={values.signatureDataUrl}
                          onChange={(dataUrl) =>
                            setValue("signatureDataUrl", dataUrl, { shouldValidate: true })
                          }
                        />
                        {errors.signatureDataUrl && (
                          <p className="mt-1 text-xs text-danger">{errors.signatureDataUrl.message}</p>
                        )}
                        {values.signatureDataUrl && (
                          <p className="mt-2 text-[11px] text-muted">
                            Signed at {new Date().toLocaleString()} · logged with enrollment record
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between border-t border-[#F1F3F5] pt-4">
                <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1}>
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                {step < 5 ? (
                  <Button type="button" onClick={nextStep}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit">
                    {isPublic
                      ? "Submit enrollment"
                      : values.completionMode === "invite_to_pay"
                        ? "Create secure invite link"
                        : "Complete Enrollment & Issue ID Card"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <IdCardPreviewModal
        open={!!issuedCard}
        card={issuedCard}
        onClose={() => setIssuedCard(null)}
        title="Student ID Card generated"
        subtitle="Enrollment saved to the portal with documents & signature on file."
      />

      <EnrollmentInviteLinkModal
        open={!!inviteModal}
        invite={inviteModal}
        onClose={() => {
          setInviteModal(null);
          setStep(1);
          form.reset();
        }}
      />
    </div>
  );
}
