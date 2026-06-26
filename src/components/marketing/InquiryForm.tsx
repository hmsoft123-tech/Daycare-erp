"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const inquirySchema = z.object({
  parentName: z.string().min(2, "Name required"),
  phone: z.string().min(10, "Valid phone required"),
  email: z.string().email("Valid email required"),
  childName: z.string().min(2, "Child name required"),
  childAge: z.number().min(1).max(12),
  branchId: z.string().min(1, "Select a branch"),
  program: z.string().min(1, "Select a program"),
  message: z.string().optional(),
});

type InquiryFormData = z.infer<typeof inquirySchema>;

const PROGRAMS = ["Daycare", "Preschool", "Kindergarten", "After School", "Therapy Services"];

export function InquiryForm() {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { program: "", branchId: "" },
  });

  const onSubmit = handleSubmit((data) => {
    toast.success(`Thank you, ${data.parentName}! We will contact you within 24 hours.`);
    reset();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="parentName">Parent Name</Label>
              <Input id="parentName" {...register("parentName")} />
              {errors.parentName && <p className="mt-1 text-xs text-red-600">{errors.parentName.message}</p>}
            </div>
            <div>
              <Label htmlFor="childName">Child Name</Label>
              <Input id="childName" {...register("childName")} />
              {errors.childName && <p className="mt-1 text-xs text-red-600">{errors.childName.message}</p>}
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
          <div>
            <Label htmlFor="childAge">Child Age</Label>
            <Input id="childAge" type="number" min={1} max={12} {...register("childAge", { valueAsNumber: true })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
          <div>
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea id="message" rows={3} {...register("message")} />
          </div>
          <Button type="submit" className="w-full">Submit Inquiry</Button>
        </form>
      </CardContent>
    </Card>
  );
}
