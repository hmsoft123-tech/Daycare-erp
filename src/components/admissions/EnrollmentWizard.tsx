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
  parentName: z.string().min(2, "Parent name required"),
  parentPhone: z.string().min(10, "Valid phone required"),
  parentEmail: z.string().email("Valid email required"),
  relation: z.enum(["father", "mother", "guardian"]),
  branchId: z.string().min(1, "Branch required"),
  program: z.string().min(1, "Program required"),
  startDate: z.string().min(1, "Start date required"),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContact: z.string().min(2, "Emergency contact required"),
  termsAccepted: z.boolean().refine((v) => v === true, "You must accept terms"),
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

const STEPS = [
  { id: 1, title: "Student Info" },
  { id: 2, title: "Parent / Guardian" },
  { id: 3, title: "Program & Branch" },
  { id: 4, title: "Medical Info" },
  { id: 5, title: "Review & Submit" },
];

const PROGRAMS = ["Daycare", "Preschool", "Kindergarten", "After School"];

export function EnrollmentWizard() {
  const [step, setStep] = useState(1);

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dob: "",
      gender: "male",
      parentName: "",
      parentPhone: "",
      parentEmail: "",
      relation: "father",
      branchId: "",
      program: "",
      startDate: "",
      allergies: "",
      medicalNotes: "",
      emergencyContact: "",
      termsAccepted: false,
    },
    mode: "onChange",
  });

  const { register, watch, setValue, trigger, formState: { errors } } = form;
  const values = watch();

  const stepFields: (keyof EnrollmentFormData)[][] = [
    ["firstName", "lastName", "dob", "gender"],
    ["parentName", "parentPhone", "parentEmail", "relation"],
    ["branchId", "program", "startDate"],
    ["allergies", "medicalNotes", "emergencyContact"],
    ["termsAccepted"],
  ];

  const nextStep = async () => {
    const valid = await trigger(stepFields[step - 1]);
    if (valid) setStep((s) => Math.min(s + 1, 5));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const onSubmit = form.handleSubmit(() => {
    toast.success("Enrollment submitted successfully!");
    setStep(1);
    form.reset();
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex flex-1 items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                step > s.id ? "bg-emerald-500 text-white" : step === s.id ? "bg-brand-500 text-white" : "bg-gray-200 text-gray-500"
              )}
            >
              {step > s.id ? <Check className="h-4 w-4" /> : s.id}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("mx-2 h-0.5 flex-1", step > s.id ? "bg-emerald-500" : "bg-gray-200")} />
            )}
          </div>
        ))}
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
                      <Label htmlFor="startDate">Preferred Start Date</Label>
                      <Input id="startDate" type="date" {...register("startDate")} />
                      {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate.message}</p>}
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <div>
                      <Label htmlFor="allergies">Known Allergies</Label>
                      <Input id="allergies" placeholder="e.g. Peanuts, Dairy" {...register("allergies")} />
                    </div>
                    <div>
                      <Label htmlFor="medicalNotes">Medical Notes</Label>
                      <Textarea id="medicalNotes" rows={3} {...register("medicalNotes")} />
                    </div>
                    <div>
                      <Label htmlFor="emergencyContact">Emergency Contact</Label>
                      <Input id="emergencyContact" {...register("emergencyContact")} />
                      {errors.emergencyContact && <p className="mt-1 text-xs text-red-600">{errors.emergencyContact.message}</p>}
                    </div>
                  </>
                )}

                {step === 5 && (
                  <div className="space-y-3 rounded-lg bg-gray-50 p-4 text-sm">
                    <p><span className="font-medium">Student:</span> {values.firstName} {values.lastName}</p>
                    <p><span className="font-medium">DOB:</span> {values.dob}</p>
                    <p><span className="font-medium">Parent:</span> {values.parentName} ({values.relation})</p>
                    <p><span className="font-medium">Contact:</span> {values.parentPhone}</p>
                    <p><span className="font-medium">Program:</span> {values.program}</p>
                    <p><span className="font-medium">Branch:</span> {branches.find((b) => b.id === values.branchId)?.name}</p>
                    <p><span className="font-medium">Start:</span> {values.startDate}</p>
                    {values.allergies && <p><span className="font-medium">Allergies:</span> {values.allergies}</p>}
                    <div className="flex items-center gap-2 pt-2">
                      <Checkbox
                        id="terms"
                        checked={values.termsAccepted}
                        onCheckedChange={(c) => setValue("termsAccepted", c === true)}
                      />
                      <Label htmlFor="terms" className="text-sm font-normal">
                        I confirm all information is accurate and agree to enrollment terms
                      </Label>
                    </div>
                    {errors.termsAccepted && <p className="text-xs text-red-600">{errors.termsAccepted.message}</p>}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex justify-between">
              <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              {step < 5 ? (
                <Button type="button" onClick={nextStep}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit">Submit Enrollment</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
