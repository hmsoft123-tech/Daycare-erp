"use client";

import { useRef, useState, useEffect } from "react";
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
import { WalkInFeeFields } from "@/components/admissions/WalkInFeeFields";
import { classes, students } from "@/data/students";
import { useBranches } from "@/lib/hooks/use-branches";
import { generateStudentCardNumber } from "@/lib/id-card";
import { completeEnrollmentInvite } from "@/lib/enrollment-invite-store";
import { useTenantStore } from "@/lib/tenant-store";
import { SDLC_TERMS_AND_CONDITIONS } from "@/data/sdlc-terms";
import { formatCurrency, cn } from "@/lib/utils";
import { CLASS_GROUPS } from "@/data/services";
import {
  extrasFromSelection,
  planAdmissionFee,
  planId,
  planLabel,
  planMonthlyTotal,
} from "@/lib/services-catalog";
import { requestEnrollmentFeeLock } from "@/lib/mock-service";
import { publicApi, useApiClient } from "@/lib/api";
import {
  PAYMENT_METHODS,
  apiErrorMessage,
  proposeFeesBody,
  type ApiFullManualEnrollment,
  type ApiPaymentMethod,
  type ApiPaymentUrl,
} from "@/lib/admissions-api";
import {
  COMPANY_ID,
  MAX_DOCUMENT_BYTES,
  dataUrlToFile,
  uploadEnrollmentDocument,
  uploadEnrollmentDocuments,
  wizardDataBody,
  type ApiDocumentType,
  type ApiEnrollmentSubmission,
} from "@/lib/enrollment-api";
import { generateGrNumber } from "@/lib/gr-number";
import { recommendClassGroupFromDob } from "@/lib/age-brackets";
import { toast } from "sonner";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Loader2,
  Upload,
} from "lucide-react";
import type { Student } from "@/types";

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
  emergencyId: z.string().optional(), // sent as emergencyContactCnic
  // Step 3
  allergies: z.array(z.string()),
  allergyDetails: z.string().optional(),
  specialNeeds: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  medicalAuthorization: z.boolean().refine((v) => v === true, "Medical authorization required"),
  // Step 4 — staff wizard only (see adminEnrollmentSchema); the parent's form has no program step
  joiningDate: z.string(),
  branchId: z.string(),
  classGroup: z.string(),
  careTier: z.enum(["base", "lite", "plus", "pro"]),
  addOns: z.array(z.string()),
  program: z.string(),
  serviceIds: z.array(z.number()),
  discountCodes: z.array(z.string()),
  completionMode: z.enum(["invite_to_pay", "mark_enrolled"]),
  /** Opens daycare-specific fields after common program selection */
  daycareTrack: z.boolean(),
  daycareDropOff: z.string().optional(),
  daycarePickUp: z.string().optional(),
  daycareNapNotes: z.string().optional(),
  daycareFeedingNotes: z.string().optional(),
  daycareAuthorizedPickup: z.string().optional(),
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

/**
 * Walk-in enrollment picks the program here; the parent's form gets it from the locked fees.
 * Front desk can register a child before the documents are brought in.
 */
const adminEnrollmentSchema = enrollmentSchema.extend({
  joiningDate: z.string().min(1, "Target joining date required"),
  branchId: z.string().min(1, "Branch required"),
  program: z.string().min(1, "Select a program"),
  passportPhotoName: z.string(),
  docPassportPhotos: z.string(),
  docFatherCnic: z.string(),
  docMotherCnic: z.string(),
  docFamilyPhoto: z.string(),
  docBirthCertificate: z.string(),
  docUtilityBill: z.string(),
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

const PROGRAM_STEP = 4;

const STEPS = [
  { id: 1, title: "Child Profile", short: "Child" },
  { id: 2, title: "Parents & Emergency", short: "Parents" },
  { id: 3, title: "Medical & Daily Care", short: "Medical" },
  { id: PROGRAM_STEP, title: "Program & Fees", short: "Program" },
  { id: 5, title: "Documents & Sign-Off", short: "Docs" },
];

const TERMS_TEXT = SDLC_TERMS_AND_CONDITIONS;

/** A document uploaded the moment it is picked (parent form with a backend token). */
type UploadState = { status: "uploading" | "done" | "error"; documentId?: number; error?: string };

/** Branch picker for the staff wizard — the user's branches from the login. */
function AdminBranchSelect({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const { branches, isLoading } = useBranches();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="mt-1">
        <SelectValue placeholder={isLoading ? "Loading branches…" : "Select branch"} />
      </SelectTrigger>
      <SelectContent>
        {branches.map((b) => (
          <SelectItem key={b.code} value={b.code}>
            {b.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function FileSlot({
  label,
  hint,
  value,
  onFile,
  error,
  upload,
}: {
  label: string;
  hint: string;
  value?: string;
  onFile: (file: File) => void;
  error?: string;
  upload?: UploadState;
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
                // Same file can be picked again after a failed upload.
                e.target.value = "";
                if (f) onFile(f);
              }}
            />
          </label>
          {value && (
            <p className="mt-2 flex items-center gap-1.5 truncate text-xs font-medium text-heading">
              {upload?.status === "uploading" && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-500" />}
              {upload?.status === "done" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
              {upload?.status === "error" && <AlertCircle className="h-3.5 w-3.5 shrink-0 text-danger" />}
              <span className="truncate">{value}</span>
              {upload?.status === "uploading" && <span className="shrink-0 font-normal text-muted">· uploading…</span>}
              {upload?.status === "done" && <span className="shrink-0 font-normal text-muted">· uploaded</span>}
            </p>
          )}
          {upload?.status === "error" && (
            <p className="mt-1 text-xs text-danger">
              {upload.error ?? "Upload failed"} — it is retried on submit, or choose the file again.
            </p>
          )}
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function messageOf(e: unknown): string {
  return e instanceof Error && e.name !== "ApiError"
    ? e.message
    : "Could not complete the enrollment.";
}

type EnrollmentWizardProps = {
  /** admin = staff CRM wizard; public = tokenized parent invite page */
  mode?: "admin" | "public";
  inviteToken?: string;
  /** public mode: the token was issued by the backend, so submit through the API */
  backend?: boolean;
  prefill?: Partial<EnrollmentFormData>;
  schoolName?: string;
  onPublicComplete?: (payload: { childName: string }) => void;
};

export function EnrollmentWizard({
  mode = "admin",
  inviteToken,
  backend = false,
  prefill,
  schoolName = "Kinder Pilot",
  onPublicComplete,
}: EnrollmentWizardProps) {
  const isPublic = mode === "public";
  // The parent's form has no Program & Fees step: the program and fees were locked before the invite.
  const steps = isPublic ? STEPS.filter((s) => s.id !== PROGRAM_STEP) : STEPS;
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<Partial<Record<ApiDocumentType, File>>>({});
  const [uploads, setUploads] = useState<Partial<Record<ApiDocumentType, UploadState>>>({});
  /** Latest upload per document type — a replaced file supersedes an older in-flight one. */
  const inflight = useRef<Partial<Record<ApiDocumentType, Promise<number>>>>({});
  const [progress, setProgress] = useState<string | null>(null);
  const api = useApiClient();
  /** Documents upload as they are picked only when a backend token exists (parent's emailed link). */
  const uploadToken = isPublic && backend && inviteToken ? inviteToken : null;

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(isPublic ? enrollmentSchema : adminEnrollmentSchema),
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
      program: "",
      serviceIds: [],
      discountCodes: [],
      completionMode: isPublic ? "mark_enrolled" : "mark_enrolled",
      daycareTrack: false,
      daycareDropOff: "",
      daycarePickUp: "",
      daycareNapNotes: "",
      daycareFeedingNotes: "",
      daycareAuthorizedPickup: "",
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

  // The tenant resolved from the subdomain is the company the enrollment is filed under.
  const companyId = useTenantStore((s) => s.tenantId) || COMPANY_ID;
  const [paymentMethod, setPaymentMethod] = useState<ApiPaymentMethod>("CASH");
  const [paymentReference, setPaymentReference] = useState("");

  const { register, watch, setValue, trigger, formState: { errors } } = form;
  const values = watch();

  useEffect(() => {
    if (!values.dob) return;
    const recommended = recommendClassGroupFromDob(values.dob);
    if (!recommended) return;
    if (!values.classGroup) {
      setValue("classGroup", recommended, { shouldValidate: true });
      if (recommended === "infant") setValue("daycareTrack", true);
    }
  }, [values.dob, values.classGroup, setValue]);

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
    ["joiningDate", "branchId", "program", "completionMode"],
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

  const stepIndex = Math.max(0, steps.findIndex((s) => s.id === step));
  const lastStep = steps[steps.length - 1].id;
  const nextStep = async () => {
    const valid = await trigger(stepFields[step - 1]);
    if (valid) setStep(steps[Math.min(stepIndex + 1, steps.length - 1)].id);
  };
  const prevStep = () => setStep(steps[Math.max(stepIndex - 1, 0)].id);

  const startUpload = (type: ApiDocumentType, file: File, token: string): Promise<number> => {
    const job = uploadEnrollmentDocument(publicApi, token, type, file);
    inflight.current[type] = job;
    setUploads((u) => ({ ...u, [type]: { status: "uploading" } }));
    job.then(
      (documentId) => {
        if (inflight.current[type] === job) setUploads((u) => ({ ...u, [type]: { status: "done", documentId } }));
      },
      (e) => {
        if (inflight.current[type] === job) {
          setUploads((u) => ({ ...u, [type]: { status: "error", error: apiErrorMessage(e, "Upload failed") } }));
        }
      }
    );
    return job;
  };

  const pickFile = (field: keyof EnrollmentFormData, type: ApiDocumentType) => (file: File) => {
    if (file.size > MAX_DOCUMENT_BYTES) {
      toast.error(`${file.name} is larger than 10 MB — please choose a smaller scan or photo.`);
      return;
    }
    setFiles((prev) => ({ ...prev, [type]: file }));
    setValue(field, file.name, { shouldValidate: true });
    if (uploadToken) void startUpload(type, file, uploadToken).catch(() => {});
  };

  /**
   * Ids of the documents already uploaded while the parent filled the form; any
   * still in flight are awaited and failed ones are retried once.
   */
  const collectDocumentIds = async (token: string) => {
    const entries = Object.entries(files) as [ApiDocumentType, File][];
    const ids = await Promise.all(
      entries.map(async ([type, file]) => {
        const done = uploads[type];
        if (done?.status === "done" && done.documentId != null) return done.documentId;
        try {
          return await (inflight.current[type] ?? startUpload(type, file, token));
        } catch {
          return startUpload(type, file, token);
        }
      })
    );
    return Object.fromEntries(entries.map(([type], i) => [type, ids[i]])) as Partial<
      Record<ApiDocumentType, number>
    >;
  };
  const uploading = Object.values(uploads).some((u) => u?.status === "uploading");

  const toggleAllergy =(item: string) => {
    const current = values.allergies ?? [];
    setValue(
      "allergies",
      current.includes(item) ? current.filter((a) => a !== item) : [...current, item],
      { shouldValidate: true }
    );
  };

  /** Staff wizard: documents plus the signature, uploaded in parallel once a token exists. */
  const uploadDocuments = (token: string, data: EnrollmentFormData) => {
    setProgress("Uploading documents…");
    return uploadEnrollmentDocuments(publicApi, token, {
      ...files,
      DIGITAL_SIGNATURE: dataUrlToFile(data.signatureDataUrl, "signature.png"),
    });
  };

  /**
   * Parent opened a backend-issued link: the documents were uploaded as they were
   * picked, so only the signature is left before the form is submitted.
   */
  const submitPublic = async (data: EnrollmentFormData, token: string) => {
    setProgress(uploading ? "Finishing uploads…" : "Saving signature…");
    const [documents, signatureId] = await Promise.all([
      collectDocumentIds(token),
      uploadEnrollmentDocument(
        publicApi,
        token,
        "DIGITAL_SIGNATURE",
        dataUrlToFile(data.signatureDataUrl, "signature.png")
      ),
    ]);
    setProgress("Submitting enrollment…");
    // No programAndFees: the program and fees were locked with the invite (stage 3c).
    await publicApi.post<ApiEnrollmentSubmission>(
      `/enrollment/${encodeURIComponent(token)}/submit`,
      wizardDataBody(data, null, { ...documents, DIGITAL_SIGNATURE: signatureId })
    );
    toast.success("Enrollment submitted — the school will confirm your fee payment");
    onPublicComplete?.({ childName: data.childFullName });
  };

  /**
   * Staff (walk-in) enrollment in one call: `POST /admissions/enrollment/full-manual`
   * creates the inquiry, submits the wizard, locks the fees / issues the challan and,
   * when the fee was received at the desk, converts the child to an active student.
   * The server prices `feeProposal` from the fee structures, so no amounts are sent.
   * The company is the tenant resolved from this subdomain.
   */
  const submitAdmin = async (data: EnrollmentFormData) => {
    const paid = data.completionMode === "mark_enrolled";
    if (paid && paymentMethod !== "CASH" && !paymentReference.trim()) {
      throw new Error("Enter the transaction / cheque reference for the payment.");
    }

    setProgress("Submitting enrollment…");
    const result = await api.post<ApiFullManualEnrollment>("/admissions/enrollment/full-manual", {
      companyId,
      branchId: data.branchId || undefined,
      wizardData: wizardDataBody(data, data.program, {}),
      feeProposal: proposeFeesBody({
        gradeOrProgram: data.program,
        branchCode: data.branchId,
        additionalServiceIds: data.serviceIds,
        discountCodes: data.discountCodes,
        notes: "Walk-in enrollment",
      }),
      confirmPayment: paid,
      paymentDetails: paid
        ? {
            paymentMethod,
            transactionReference: paymentReference.trim() || undefined,
            paymentNotes: "Received at enrollment (staff wizard)",
          }
        : undefined,
      staffNotes: `Entered by staff via enrollment wizard · joining ${data.joiningDate} · ${data.residentialAddress}`,
    });

    // Documents can only be uploaded against an enrollment token, which full-manual does not return.
    try {
      setProgress("Uploading documents…");
      const link = await api.post<ApiPaymentUrl>(
        `/admissions/inquiries/${result.inquiryId}/generate-payment-url?resendEmail=${!paid}`
      );
      if (!link.enrollmentToken) throw new Error("no enrollment token was returned");
      await uploadDocuments(link.enrollmentToken, data);
    } catch (e) {
      toast.warning(
        `Enrollment saved, but the documents could not be attached: ${apiErrorMessage(e, messageOf(e))}`
      );
    }

    toast.success(
      paid
        ? `${result.message || `Enrolled — student ${result.studentCode ?? result.studentId ?? ""} is active`}${
            result.netAmount != null ? ` · ${formatCurrency(result.netAmount)}` : ""
          }`
        : `Challan ${result.challanNumber ?? ""} issued — the payment link was emailed to the parent`
    );
    setStep(1);
    setFiles({});
    setPaymentReference("");
    form.reset();
  };

  const onSubmit = form.handleSubmit(async (data) => {
    if (!isPublic || (backend && inviteToken)) {
      try {
        if (isPublic) await submitPublic(data, inviteToken!);
        else await submitAdmin(data);
      } catch (e) {
        toast.error(apiErrorMessage(e, messageOf(e)));
      } finally {
        setProgress(null);
      }
      return;
    }

    // Local demo invite (mock token): keep the offline flow below.
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
      grNumber: generateGrNumber(
        data.branchId,
        students.map((s) => s.grNumber).filter(Boolean) as string[]
      ),
      daycare: data.daycareTrack
        ? {
            track: true,
            dropOff: data.daycareDropOff,
            pickUp: data.daycarePickUp,
            napNotes: data.daycareNapNotes,
            feedingNotes: data.daycareFeedingNotes,
            authorizedPickup: data.daycareAuthorizedPickup,
          }
        : undefined,
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
          <h3 className="font-heading text-sm font-bold text-heading">Documents checklist</h3>
          <p className="mt-1 text-xs text-muted">
            You can submit without them if the parent has not brought them yet.
          </p>
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
            {steps.map((s, i) => (
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
                    {step > s.id ? <Check className="h-3.5 w-3.5" /> : i + 1}
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
                        onFile={pickFile("passportPhotoName", "CHILD_PASSPORT_PHOTO")}
                        upload={uploads.CHILD_PASSPORT_PHOTO}
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
                            <Label>CNIC / National ID (optional)</Label>
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
                        <h2 className="font-heading text-lg font-bold text-heading">Program, services & fees</h2>
                        <p className="text-sm text-muted">
                          Amounts come from the school&apos;s fee structures
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
                          <AdminBranchSelect
                            value={values.branchId}
                            onChange={(v) => setValue("branchId", v, { shouldValidate: true })}
                          />
                          {errors.branchId && (
                            <p className="mt-1 text-xs text-danger">{errors.branchId.message}</p>
                          )}
                        </div>
                      </div>
                      <WalkInFeeFields
                        branchCode={values.branchId}
                        suggestedProgram={CLASS_GROUPS.find((g) => g.id === values.classGroup)?.label}
                        program={values.program}
                        serviceIds={values.serviceIds}
                        discountCodes={values.discountCodes}
                        error={errors.program?.message}
                        onProgramChange={(v) => setValue("program", v, { shouldValidate: true })}
                        onServiceIdsChange={(ids) => setValue("serviceIds", ids)}
                        onDiscountCodesChange={(codes) => setValue("discountCodes", codes)}
                      />

                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-bg px-3 py-3">
                        <Checkbox
                          checked={!!values.daycareTrack}
                          onCheckedChange={(c) => setValue("daycareTrack", c === true)}
                        />
                        <span>
                          <span className="block text-sm font-semibold text-heading">Daycare enrollment</span>
                          <span className="text-xs text-muted">
                            After the common form, capture daycare-specific care details (HO form shell).
                          </span>
                        </span>
                      </label>

                      {values.daycareTrack && (
                        <div className="space-y-3 rounded-2xl border border-brand-200 bg-brand-50/40 p-4">
                          <div>
                            <h3 className="text-sm font-bold text-heading">Daycare enrollment form</h3>
                            <p className="text-xs text-muted">
                              Separate from standard enrollment · full HO template pending
                            </p>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <Label htmlFor="daycareDropOff">Preferred drop-off</Label>
                              <Input id="daycareDropOff" className="mt-1" {...register("daycareDropOff")} placeholder="e.g. 08:00" />
                            </div>
                            <div>
                              <Label htmlFor="daycarePickUp">Preferred pick-up</Label>
                              <Input id="daycarePickUp" className="mt-1" {...register("daycarePickUp")} placeholder="e.g. 16:30" />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="daycareNapNotes">Nap / rest notes</Label>
                            <Textarea id="daycareNapNotes" className="mt-1" rows={2} {...register("daycareNapNotes")} />
                          </div>
                          <div>
                            <Label htmlFor="daycareFeedingNotes">Feeding / formula notes</Label>
                            <Textarea id="daycareFeedingNotes" className="mt-1" rows={2} {...register("daycareFeedingNotes")} />
                          </div>
                          <div>
                            <Label htmlFor="daycareAuthorizedPickup">Authorized pickup persons</Label>
                            <Input id="daycareAuthorizedPickup" className="mt-1" {...register("daycareAuthorizedPickup")} placeholder="Names as on CNIC" />
                          </div>
                        </div>
                      )}

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
                          <p className="font-semibold text-heading">Fee not paid yet</p>
                          <p className="mt-1 text-xs text-muted">
                            Issues the challan (Enrolled Unpaid) and emails the parent the payment link
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
                          <p className="font-semibold text-heading">Fee received — enroll now</p>
                          <p className="mt-1 text-xs text-muted">
                            Records the payment and activates the student immediately
                          </p>
                        </label>
                      </div>
                      )}
                      {!isPublic && values.completionMode === "mark_enrolled" && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label>Payment method</Label>
                            <Select
                              value={paymentMethod}
                              onValueChange={(v) => setPaymentMethod(v as ApiPaymentMethod)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PAYMENT_METHODS.map((m) => (
                                  <SelectItem key={m.value} value={m.value}>
                                    {m.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="paymentReference">
                              Transaction reference{paymentMethod === "CASH" ? " (optional)" : ""}
                            </Label>
                            <Input
                              id="paymentReference"
                              className="mt-1"
                              value={paymentReference}
                              onChange={(e) => setPaymentReference(e.target.value)}
                            />
                          </div>
                          <p className="text-xs text-muted sm:col-span-2">
                            The payment is recorded against the challan amount the server calculates.
                          </p>
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
                          onFile={pickFile("docPassportPhotos", "PASSPORT_PHOTOS")}
                          upload={uploads.PASSPORT_PHOTOS}
                          error={errors.docPassportPhotos?.message}
                        />
                        <FileSlot
                          label={DOC_SLOTS[1].label}
                          hint={DOC_SLOTS[1].hint}
                          value={values.docFatherCnic}
                          onFile={pickFile("docFatherCnic", "FATHER_CNIC")}
                          upload={uploads.FATHER_CNIC}
                          error={errors.docFatherCnic?.message}
                        />
                        <FileSlot
                          label={DOC_SLOTS[2].label}
                          hint={DOC_SLOTS[2].hint}
                          value={values.docMotherCnic}
                          onFile={pickFile("docMotherCnic", "MOTHER_CNIC")}
                          upload={uploads.MOTHER_CNIC}
                          error={errors.docMotherCnic?.message}
                        />
                        <FileSlot
                          label={DOC_SLOTS[3].label}
                          hint={DOC_SLOTS[3].hint}
                          value={values.docFamilyPhoto}
                          onFile={pickFile("docFamilyPhoto", "FAMILY_PHOTO")}
                          upload={uploads.FAMILY_PHOTO}
                          error={errors.docFamilyPhoto?.message}
                        />
                        <FileSlot
                          label={DOC_SLOTS[4].label}
                          hint={DOC_SLOTS[4].hint}
                          value={values.docBirthCertificate}
                          onFile={pickFile("docBirthCertificate", "B_FORM_BIRTH_CERTIFICATE")}
                          upload={uploads.B_FORM_BIRTH_CERTIFICATE}
                          error={errors.docBirthCertificate?.message}
                        />
                        <FileSlot
                          label={DOC_SLOTS[5].label}
                          hint={DOC_SLOTS[5].hint}
                          value={values.docUtilityBill}
                          onFile={pickFile("docUtilityBill", "ELECTRICITY_BILL")}
                          upload={uploads.ELECTRICITY_BILL}
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
                {step !== lastStep ? (
                  <Button type="button" onClick={nextStep}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={!!progress}>
                    {progress && <Loader2 className="h-4 w-4 animate-spin" />}
                    {progress
                      ? progress
                      : isPublic
                      ? "Submit enrollment"
                      : values.completionMode === "invite_to_pay"
                        ? "Submit & issue challan"
                        : "Submit & enroll student"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
