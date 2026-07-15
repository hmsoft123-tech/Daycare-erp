"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const therapySchema = z.object({
  studentId: z.string().min(1),
  therapistName: z.string().min(2, "Therapist name required"),
  duration: z.number().min(15).max(120),
  types: z.string().min(1, "Session types required"),
  subjective: z.string().min(5, "Subjective notes required"),
  objective: z.string().min(5, "Objective notes required"),
  assessment: z.string().min(5, "Assessment required"),
  plan: z.string().min(5, "Plan required"),
  complianceScore: z.number().min(1).max(10),
});

type TherapyFormData = z.infer<typeof therapySchema>;

interface TherapyLogFormProps {
  studentId?: string;
  studentName?: string;
}

export function TherapyLogForm({ studentId = "", studentName }: TherapyLogFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TherapyFormData>({
    resolver: zodResolver(therapySchema),
    defaultValues: {
      studentId,
      therapistName: "",
      duration: 45,
      types: "",
      subjective: "",
      objective: "",
      assessment: "",
      plan: "",
      complianceScore: 7,
    },
  });

  const onSubmit = handleSubmit((data) => {
    toast.success(`Therapy log saved for ${studentName ?? data.studentId}`);
    reset({ ...data, subjective: "", objective: "", assessment: "", plan: "" });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Therapy Session Log</CardTitle>
        {studentName && <p className="text-sm text-gray-500">Patient: {studentName}</p>}
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" {...register("studentId")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="therapistName">Therapist</Label>
              <Input id="therapistName" {...register("therapistName")} />
              {errors.therapistName && <p className="mt-1 text-xs text-red-600">{errors.therapistName.message}</p>}
            </div>
            <div>
              <Label htmlFor="duration">Duration (min)</Label>
              <Input id="duration" type="number" {...register("duration", { valueAsNumber: true })} />
            </div>
          </div>
          <div>
            <Label htmlFor="types">Session Types</Label>
            <Input id="types" placeholder="Speech, ABA, Occupational" {...register("types")} />
            {errors.types && <p className="mt-1 text-xs text-red-600">{errors.types.message}</p>}
          </div>
          <div>
            <Label htmlFor="subjective">Subjective (S)</Label>
            <Textarea id="subjective" rows={2} {...register("subjective")} />
            {errors.subjective && <p className="mt-1 text-xs text-red-600">{errors.subjective.message}</p>}
          </div>
          <div>
            <Label htmlFor="objective">Objective (O)</Label>
            <Textarea id="objective" rows={2} {...register("objective")} />
            {errors.objective && <p className="mt-1 text-xs text-red-600">{errors.objective.message}</p>}
          </div>
          <div>
            <Label htmlFor="assessment">Assessment (A)</Label>
            <Textarea id="assessment" rows={2} {...register("assessment")} />
            {errors.assessment && <p className="mt-1 text-xs text-red-600">{errors.assessment.message}</p>}
          </div>
          <div>
            <Label htmlFor="plan">Plan (P)</Label>
            <Textarea id="plan" rows={2} {...register("plan")} />
            {errors.plan && <p className="mt-1 text-xs text-red-600">{errors.plan.message}</p>}
          </div>
          <div>
            <Label htmlFor="complianceScore">Compliance Score (1-10)</Label>
            <Input id="complianceScore" type="number" min={1} max={10} {...register("complianceScore", { valueAsNumber: true })} />
          </div>
          <Button type="submit">Save Session Log</Button>
        </form>
      </CardContent>
    </Card>
  );
}
