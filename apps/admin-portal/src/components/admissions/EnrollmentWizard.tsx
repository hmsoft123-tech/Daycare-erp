"use client";

import { useState } from "react";
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
import { branches } from "@/data/branches";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const enrollmentSchema = z.object({
  firstName: z.string().min(2, "First name required"),
  lastName: z.string().min(2, "Last name required"),
  dob: z.string().min(1, "Date of birth required"),
  gender: z.enum(["male", "female"]),
  bloodGroup: z.string().optional(),
  parentName: z.string().min(2, "Parent name required"),
  parentPhone: z.string().min(10, "Valid phone required"),
  parentEmail: z.string().email("Valid email required"),
  relation: z.enum(["father", "mother", "guardian"]),
  secondaryGuardian: z.string().optional(),
  branchId: z.string().min(1, "Branch required"),
  program: z.string().min(1, "Program required"),
  classroom: z.string().min(1, "Classroom required"),
  startDate: z.string().min(1, "Start date required"),
  schedulePreference: z.enum(["full_time", "part_time", "half_day"]),
  monthlyTuition: z.number().min(0, "Monthly tuition required"),
  registrationFee: z.number().min(0),
  feeNotes: z.string().optional(),
  waiveRegistration: z.boolean(),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContact: z.string().min(2, "Emergency contact required"),
  emergencyPhone: z.string().min(10, "Emergency phone required"),
  physician: z.string().optional(),
  photoConsent: z.boolean().refine((v) => v === true, "Photo consent required"),
  medicalConsent: z.boolean().refine((v) => v === true, "Medical consent required"),
  handbookAck: z.boolean().refine((v) => v === true, "Handbook acknowledgment required"),
  completionMode: z.enum(["invite_to_pay", "mark_enrolled"]),
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

const STEPS = [
  { id: 1, title: "Student", short: "Student" },
  { id: 2, title: "Parent / Guardian", short: "Parent" },
  { id: 3, title: "Program & Classroom", short: "Program" },
  { id: 4, title: "Tuition & Fees", short: "Fees" },
  { id: 5, title: "Medical & Emergency", short: "Medical" },
  { id: 6, title: "Documents & Consents", short: "Docs" },
  { id: 7, title: "Review & Invite", short: "Review" },
];

const PROGRAMS = ["Daycare", "Preschool", "Kindergarten", "After School"];
const CLASSROOMS = [
  "Toddler Section A",
  "Toddler Section B",
  "Preschool A",
  "Kindergarten A",
];

export function EnrollmentWizard() {
  const [step, setStep] = useState(1);

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dob: "",
      gender: "male",
      bloodGroup: "",
      parentName: "",
      parentPhone: "",
      parentEmail: "",
      relation: "father",
      secondaryGuardian: "",
      branchId: "",
      program: "",
      classroom: "",
      startDate: "",
      schedulePreference: "full_time",
      monthlyTuition: 80000,
      registrationFee: 5000,
      feeNotes: "",
      waiveRegistration: false,
      allergies: "",
      medicalNotes: "",
      emergencyContact: "",
      emergencyPhone: "",
      physician: "",
      photoConsent: false,
      medicalConsent: false,
      handbookAck: false,
      completionMode: "invite_to_pay",
    },
    mode: "onChange",
  });

  const { register, watch, setValue, trigger, formState: { errors } } = form;
  const values = watch();

  const stepFields: (keyof EnrollmentFormData)[][] = [
    ["firstName", "lastName", "dob", "gender"],
    ["parentName", "parentPhone", "parentEmail", "relation"],
    ["branchId", "program", "classroom", "startDate", "schedulePreference"],
    ["monthlyTuition", "registrationFee"],
    ["emergencyContact", "emergencyPhone"],
    ["photoConsent", "medicalConsent", "handbookAck"],
    ["completionMode"],
  ];

  const nextStep = async () => {
    const valid = await trigger(stepFields[step - 1]);
    if (valid) setStep((s) => Math.min(s + 1, 7));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const onSubmit = form.handleSubmit((data) => {
    if (data.completionMode === "invite_to_pay") {
      toast.success(
        "Parent invitation sent. Student moved to Enrol Unpaid. Invoice generated."
      );
    } else {
      toast.success("Enrollment complete — student marked as active.");
    }
    setStep(1);
    form.reset();
  });

  const handleWaiveRegistration = (checked: boolean) => {
    setValue("waiveRegistration", checked);
    setValue("registrationFee", checked ? 0 : 5000);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Sticky step sidebar — visible on scroll */}
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
                          : "bg-[#F4F6F8] text-muted"
                    )}
                  >
                    {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
                  </span>
                  <span className="leading-tight">{s.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <div>
          {/* Mobile horizontal stepper */}
          <div className="mb-6 overflow-x-auto pb-2 lg:hidden">
            <div className="flex min-w-[480px] items-center gap-1">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex flex-1 items-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium",
                      step > s.id ? "bg-emerald-500 text-white" : step === s.id ? "bg-brand-500 text-white" : "bg-gray-200 text-gray-500"
                    )}
                  >
                    {step > s.id ? <Check className="h-4 w-4" /> : s.id}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn("mx-1 h-0.5 flex-1", step > s.id ? "bg-emerald-500" : "bg-gray-200")} />
                  )}
                </div>
              ))}
            </div>
          </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-6 font-heading text-xl font-bold">{STEPS[step - 1].title}</h2>

          <form onSubmit={onSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {step === 1 && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" {...register("firstName")} />
                        {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" {...register("lastName")} />
                        {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input id="dob" type="date" {...register("dob")} />
                      {errors.dob && <p className="mt-1 text-xs text-red-600">{errors.dob.message}</p>}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Gender</Label>
                        <Select value={values.gender} onValueChange={(v) => setValue("gender", v as "male" | "female")}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="bloodGroup">Blood Group (optional)</Label>
                        <Input id="bloodGroup" placeholder="e.g. B+" {...register("bloodGroup")} />
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div>
                      <Label htmlFor="parentName">Parent / Guardian Name</Label>
                      <Input id="parentName" {...register("parentName")} />
                      {errors.parentName && <p className="mt-1 text-xs text-red-600">{errors.parentName.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="parentPhone">Phone</Label>
                      <Input id="parentPhone" placeholder="+92 300 1234567" {...register("parentPhone")} />
                      {errors.parentPhone && <p className="mt-1 text-xs text-red-600">{errors.parentPhone.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="parentEmail">Email</Label>
                      <Input id="parentEmail" type="email" {...register("parentEmail")} />
                      {errors.parentEmail && <p className="mt-1 text-xs text-red-600">{errors.parentEmail.message}</p>}
                    </div>
                    <div>
                      <Label>Relation</Label>
                      <Select value={values.relation} onValueChange={(v) => setValue("relation", v as "father" | "mother" | "guardian")}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="father">Father</SelectItem>
                          <SelectItem value="mother">Mother</SelectItem>
                          <SelectItem value="guardian">Guardian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="secondaryGuardian">Secondary Guardian (optional)</Label>
                      <Input id="secondaryGuardian" placeholder="Name and phone" {...register("secondaryGuardian")} />
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div>
                      <Label>Branch</Label>
                      <Select value={values.branchId} onValueChange={(v) => setValue("branchId", v)}>
                        <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                        <SelectContent>
                          {branches.map((b) => (
                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.branchId && <p className="mt-1 text-xs text-red-600">{errors.branchId.message}</p>}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Program</Label>
                        <Select value={values.program} onValueChange={(v) => setValue("program", v)}>
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
                        <Label>Classroom</Label>
                        <Select value={values.classroom} onValueChange={(v) => setValue("classroom", v)}>
                          <SelectTrigger><SelectValue placeholder="Select classroom" /></SelectTrigger>
                          <SelectContent>
                            {CLASSROOMS.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.classroom && <p className="mt-1 text-xs text-red-600">{errors.classroom.message}</p>}
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input id="startDate" type="date" {...register("startDate")} />
                        {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate.message}</p>}
                      </div>
                      <div>
                        <Label>Schedule</Label>
                        <Select
                          value={values.schedulePreference}
                          onValueChange={(v) => setValue("schedulePreference", v as "full_time" | "part_time" | "half_day")}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full_time">Full Time</SelectItem>
                            <SelectItem value="part_time">Part Time</SelectItem>
                            <SelectItem value="half_day">Half Day</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="monthlyTuition">Monthly Tuition (PKR)</Label>
                        <Input id="monthlyTuition" type="number" min={0} {...register("monthlyTuition", { valueAsNumber: true })} />
                        {errors.monthlyTuition && <p className="mt-1 text-xs text-red-600">{errors.monthlyTuition.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="registrationFee">Registration Fee (PKR)</Label>
                        <Input
                          id="registrationFee"
                          type="number"
                          min={0}
                          disabled={values.waiveRegistration}
                          {...register("registrationFee", { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="waiveRegistration"
                        checked={values.waiveRegistration}
                        onCheckedChange={(c) => handleWaiveRegistration(c === true)}
                      />
                      <Label htmlFor="waiveRegistration" className="text-sm font-normal">
                        Waive registration fee
                      </Label>
                    </div>
                    <div>
                      <Label htmlFor="feeNotes">Fee Notes (optional)</Label>
                      <Textarea id="feeNotes" rows={2} placeholder="Sibling discount, scholarship, etc." {...register("feeNotes")} />
                    </div>
                  </>
                )}

                {step === 5 && (
                  <>
                    <div>
                      <Label htmlFor="allergies">Known Allergies</Label>
                      <Input id="allergies" placeholder="e.g. Peanuts, Dairy" {...register("allergies")} />
                    </div>
                    <div>
                      <Label htmlFor="medicalNotes">Medical Notes</Label>
                      <Textarea id="medicalNotes" rows={3} {...register("medicalNotes")} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="emergencyContact">Emergency Contact</Label>
                        <Input id="emergencyContact" {...register("emergencyContact")} />
                        {errors.emergencyContact && <p className="mt-1 text-xs text-red-600">{errors.emergencyContact.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                        <Input id="emergencyPhone" {...register("emergencyPhone")} />
                        {errors.emergencyPhone && <p className="mt-1 text-xs text-red-600">{errors.emergencyPhone.message}</p>}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="physician">Physician (optional)</Label>
                      <Input id="physician" placeholder="Dr. name and clinic" {...register("physician")} />
                    </div>
                  </>
                )}

                {step === 6 && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="photoConsent"
                        checked={values.photoConsent}
                        onCheckedChange={(c) => setValue("photoConsent", c === true)}
                      />
                      <Label htmlFor="photoConsent" className="text-sm font-normal leading-relaxed">
                        I consent to photos/videos of my child for school communications and internal use
                      </Label>
                    </div>
                    {errors.photoConsent && <p className="text-xs text-red-600">{errors.photoConsent.message}</p>}
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="medicalConsent"
                        checked={values.medicalConsent}
                        onCheckedChange={(c) => setValue("medicalConsent", c === true)}
                      />
                      <Label htmlFor="medicalConsent" className="text-sm font-normal leading-relaxed">
                        I authorize emergency medical treatment if parents cannot be reached
                      </Label>
                    </div>
                    {errors.medicalConsent && <p className="text-xs text-red-600">{errors.medicalConsent.message}</p>}
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="handbookAck"
                        checked={values.handbookAck}
                        onCheckedChange={(c) => setValue("handbookAck", c === true)}
                      />
                      <Label htmlFor="handbookAck" className="text-sm font-normal leading-relaxed">
                        I have read and agree to the parent handbook and enrollment policies
                      </Label>
                    </div>
                    {errors.handbookAck && <p className="text-xs text-red-600">{errors.handbookAck.message}</p>}
                  </div>
                )}

                {step === 7 && (
                  <div className="space-y-4">
                    <div className="space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
                      <p><span className="font-medium">Student:</span> {values.firstName} {values.lastName}</p>
                      <p><span className="font-medium">DOB:</span> {values.dob}{values.bloodGroup ? ` · ${values.bloodGroup}` : ""}</p>
                      <p><span className="font-medium">Parent:</span> {values.parentName} ({values.relation})</p>
                      <p><span className="font-medium">Contact:</span> {values.parentPhone} · {values.parentEmail}</p>
                      <p><span className="font-medium">Program:</span> {values.program} · {values.classroom}</p>
                      <p><span className="font-medium">Branch:</span> {branches.find((b) => b.id === values.branchId)?.name}</p>
                      <p><span className="font-medium">Start:</span> {values.startDate} · {values.schedulePreference.replace("_", " ")}</p>
                      <p><span className="font-medium">Tuition:</span> PKR {values.monthlyTuition.toLocaleString()}/mo · Reg fee PKR {values.registrationFee.toLocaleString()}</p>
                      {values.allergies && <p><span className="font-medium">Allergies:</span> {values.allergies}</p>}
                    </div>

                    <div className="space-y-3">
                      <Label>Completion mode</Label>
                      <div className="space-y-2">
                        <label className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition",
                          values.completionMode === "invite_to_pay" ? "border-brand-500 bg-brand-50" : "border-border"
                        )}>
                          <input
                            type="radio"
                            className="mt-1"
                            checked={values.completionMode === "invite_to_pay"}
                            onChange={() => setValue("completionMode", "invite_to_pay")}
                          />
                          <div>
                            <p className="text-sm font-semibold">Invite parent to pay</p>
                            <p className="text-xs text-muted">Soft-hold spot as Pending First Payment; generate invoice and send Parent Portal invite</p>
                          </div>
                        </label>
                        <label className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition",
                          values.completionMode === "mark_enrolled" ? "border-brand-500 bg-brand-50" : "border-border"
                        )}>
                          <input
                            type="radio"
                            className="mt-1"
                            checked={values.completionMode === "mark_enrolled"}
                            onChange={() => setValue("completionMode", "mark_enrolled")}
                          />
                          <div>
                            <p className="text-sm font-semibold">Mark paid (active)</p>
                            <p className="text-xs text-muted">Skip payment gate — student becomes active immediately</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex justify-between">
              <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              {step < 7 ? (
                <Button type="button" onClick={nextStep}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit">
                  {values.completionMode === "invite_to_pay" ? "Invite & Generate Invoice" : "Complete Enrollment"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}
