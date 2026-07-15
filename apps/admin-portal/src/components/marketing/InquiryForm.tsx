"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { branches } from "@/data/branches";
import { toast } from "sonner";
import type { InquiryType } from "@/types";
import { cn } from "@/lib/utils";

const inquirySchema = z
  .object({
    inquiryType: z.enum(["admission", "employment", "tour", "general"]),
    guardianFirstName: z.string().min(2, "First name required"),
    guardianLastName: z.string().min(2, "Last name required"),
    phone: z.string().min(10, "Valid phone required"),
    email: z.string().email("Valid email required"),
    childName: z.string().optional(),
    childDob: z.string().optional(),
    childAge: z.number().optional(),
    program: z.string().optional(),
    branchId: z.string().optional(),
    preferredStartDate: z.string().optional(),
    schedulePreference: z.enum(["full_time", "part_time", "half_day"]).optional(),
    positionInterest: z.enum(["Teacher", "Therapist", "Admin", "Support"]).optional(),
    experienceYears: z.number().optional(),
    resumeNote: z.string().optional(),
    message: z.string().optional(),
    preferContact: z.enum(["phone", "email", "whatsapp"]),
  })
  .superRefine((data, ctx) => {
    const needsChild = data.inquiryType === "admission" || data.inquiryType === "tour";
    if (needsChild) {
      if (!data.childName || data.childName.length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Child name required", path: ["childName"] });
      }
      if (!data.childDob) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Date of birth required", path: ["childDob"] });
      }
      if (!data.program) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select a program", path: ["program"] });
      }
      if (!data.branchId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select a branch", path: ["branchId"] });
      }
      if (!data.preferredStartDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Preferred start date required", path: ["preferredStartDate"] });
      }
      if (!data.schedulePreference) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select a schedule", path: ["schedulePreference"] });
      }
    }
    if (data.inquiryType === "employment") {
      if (!data.positionInterest) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select a position", path: ["positionInterest"] });
      }
      if (data.experienceYears === undefined || data.experienceYears < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Experience years required", path: ["experienceYears"] });
      }
    }
  });

type InquiryFormData = z.infer<typeof inquirySchema>;

const PROGRAMS = ["Daycare", "Preschool", "Kindergarten", "After School", "Therapy Services"];

const INQUIRY_TYPES: { value: InquiryType; label: string; description: string }[] = [
  { value: "admission", label: "Admission", description: "Enroll my child" },
  { value: "tour", label: "Book a Tour", description: "Visit our campus" },
  { value: "employment", label: "Employment", description: "Join our team" },
  { value: "general", label: "General", description: "Other questions" },
];

interface InquiryFormProps {
  variant?: "card" | "standalone";
  schoolName?: string;
}

function deriveAge(dob: string): number | undefined {
  if (!dob) return undefined;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : undefined;
}

export function InquiryForm(props: InquiryFormProps) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface" />}>
      <InquiryFormInner {...props} />
    </Suspense>
  );
}

function InquiryFormInner({ variant = "card", schoolName = "Kinder Pilot" }: InquiryFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeFromUrl = searchParams.get("type");
  const initialType: InquiryType =
    typeFromUrl === "admission" ||
    typeFromUrl === "employment" ||
    typeFromUrl === "tour" ||
    typeFromUrl === "general"
      ? typeFromUrl
      : "admission";

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      inquiryType: initialType,
      guardianFirstName: "",
      guardianLastName: "",
      phone: "",
      email: "",
      program: "",
      branchId: "",
      schedulePreference: undefined,
      preferContact: "phone",
    },
  });

  useEffect(() => {
    if (initialType) setValue("inquiryType", initialType);
  }, [initialType, setValue]);

  const inquiryType = watch("inquiryType");
  const childDob = watch("childDob");
  const derivedAge = childDob ? deriveAge(childDob) : undefined;

  const showChildFields = inquiryType === "admission" || inquiryType === "tour";
  const showEmploymentFields = inquiryType === "employment";

  const onSubmit = handleSubmit((data) => {
    toast.success(`Thank you, ${data.guardianFirstName}! We received your ${data.inquiryType} inquiry.`);

    if (variant === "standalone" && typeof window !== "undefined") {
      router.push(
        `/inquiry/thanks?type=${encodeURIComponent(data.inquiryType)}&name=${encodeURIComponent(data.guardianFirstName)}`
      );
      return;
    }

    reset();
  });

  const typeSelector = (
    <div>
      <Label className="mb-3 block">What can we help you with?</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        {INQUIRY_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setValue("inquiryType", t.value)}
            className={cn(
              "rounded-xl border-2 p-3 text-left transition",
              inquiryType === t.value
                ? "border-brand-500 bg-brand-50"
                : "border-border bg-surface hover:border-brand-200"
            )}
          >
            <p className="text-sm font-semibold text-heading">{t.label}</p>
            <p className="text-xs text-muted">{t.description}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const formFields = (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="guardianFirstName">First Name</Label>
          <Input id="guardianFirstName" {...register("guardianFirstName")} />
          {errors.guardianFirstName && <p className="mt-1 text-xs text-red-600">{errors.guardianFirstName.message}</p>}
        </div>
        <div>
          <Label htmlFor="guardianLastName">Last Name</Label>
          <Input id="guardianLastName" {...register("guardianLastName")} />
          {errors.guardianLastName && <p className="mt-1 text-xs text-red-600">{errors.guardianLastName.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" placeholder="+92 300 1234567" {...register("phone")} />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
      </div>

      {showChildFields && (
        <div className="space-y-4 rounded-xl border border-border bg-bg/50 p-4">
          <p className="text-sm font-semibold text-heading">Child Information</p>
          <div>
            <Label htmlFor="childName">Child Name</Label>
            <Input id="childName" {...register("childName")} />
            {errors.childName && <p className="mt-1 text-xs text-red-600">{errors.childName.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="childDob">Date of Birth</Label>
              <Input id="childDob" type="date" {...register("childDob")} />
              {errors.childDob && <p className="mt-1 text-xs text-red-600">{errors.childDob.message}</p>}
            </div>
            <div>
              <Label>Age</Label>
              <Input
                readOnly
                value={derivedAge !== undefined ? `${derivedAge} years` : "—"}
                className="bg-gray-50"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Program</Label>
              <Select value={watch("program")} onValueChange={(v) => setValue("program", v)}>
                <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                <SelectContent>
                  {PROGRAMS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.program && <p className="mt-1 text-xs text-red-600">{errors.program.message}</p>}
            </div>
            <div>
              <Label>Preferred Branch</Label>
              <Select value={watch("branchId")} onValueChange={(v) => setValue("branchId", v)}>
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.branchId && <p className="mt-1 text-xs text-red-600">{errors.branchId.message}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="preferredStartDate">Preferred Start Date</Label>
              <Input id="preferredStartDate" type="date" {...register("preferredStartDate")} />
              {errors.preferredStartDate && <p className="mt-1 text-xs text-red-600">{errors.preferredStartDate.message}</p>}
            </div>
            <div>
              <Label>Schedule Preference</Label>
              <Select
                value={watch("schedulePreference")}
                onValueChange={(v) => setValue("schedulePreference", v as "full_time" | "part_time" | "half_day")}
              >
                <SelectTrigger><SelectValue placeholder="Select schedule" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="half_day">Half Day</SelectItem>
                </SelectContent>
              </Select>
              {errors.schedulePreference && <p className="mt-1 text-xs text-red-600">{errors.schedulePreference.message}</p>}
            </div>
          </div>
        </div>
      )}

      {showEmploymentFields && (
        <div className="space-y-4 rounded-xl border border-border bg-bg/50 p-4">
          <p className="text-sm font-semibold text-heading">Employment Details</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Position of Interest</Label>
              <Select
                value={watch("positionInterest")}
                onValueChange={(v) => setValue("positionInterest", v as "Teacher" | "Therapist" | "Admin" | "Support")}
              >
                <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Teacher">Teacher</SelectItem>
                  <SelectItem value="Therapist">Therapist</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                </SelectContent>
              </Select>
              {errors.positionInterest && <p className="mt-1 text-xs text-red-600">{errors.positionInterest.message}</p>}
            </div>
            <div>
              <Label htmlFor="experienceYears">Years of Experience</Label>
              <Input id="experienceYears" type="number" min={0} {...register("experienceYears", { valueAsNumber: true })} />
              {errors.experienceYears && <p className="mt-1 text-xs text-red-600">{errors.experienceYears.message}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="resumeNote">Resume / Cover Note (optional)</Label>
            <Textarea id="resumeNote" rows={3} placeholder="Brief summary or link to portfolio..." {...register("resumeNote")} />
          </div>
        </div>
      )}

      <div>
        <Label>Preferred Contact Method</Label>
        <Select
          value={watch("preferContact")}
          onValueChange={(v) => setValue("preferContact", v as "phone" | "email" | "whatsapp")}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="message">Message (optional)</Label>
        <Textarea id="message" rows={3} placeholder={`Tell ${schoolName} anything else we should know...`} {...register("message")} />
      </div>

      <Button type="submit" className="w-full" size="lg">
        Submit Inquiry
      </Button>
    </>
  );

  const formContent = (
    <form onSubmit={onSubmit} className="space-y-6">
      {typeSelector}
      {formFields}
    </form>
  );

  if (variant === "standalone") {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="grid lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="border-b border-border bg-bg/60 p-5 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <Label className="mb-3 block text-[11px] font-semibold uppercase tracking-wider text-muted">
              Step 1 · Inquiry type
            </Label>
            <div className="space-y-2">
              {INQUIRY_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setValue("inquiryType", t.value)}
                  className={cn(
                    "w-full rounded-xl border-2 p-3 text-left transition",
                    inquiryType === t.value
                      ? "border-brand-500 bg-brand-50 shadow-sm"
                      : "border-transparent bg-surface hover:border-brand-200"
                  )}
                >
                  <p className="text-sm font-semibold text-heading">{t.label}</p>
                  <p className="text-xs text-muted">{t.description}</p>
                </button>
              ))}
            </div>
          </aside>

          <div className="p-6 sm:p-8">
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="lg:hidden">{typeSelector}</div>
              <p className="hidden text-[11px] font-semibold uppercase tracking-wider text-muted lg:block">
                Step 2 · Your details
              </p>
              {formFields}
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Information</CardTitle>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}
