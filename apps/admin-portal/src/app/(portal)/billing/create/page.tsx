"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { students } from "@/data/students";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { DiscountType } from "@/types";

const schema = z.object({
  studentId: z.string().min(1, "Select a student"),
  planType: z.string().min(1),
  amount: z.number().min(0, "Amount required"),
  admissionFee: z.number().min(0),
  discountType: z.enum(["none", "percent", "fixed", "sibling", "scholarship", "staff", "promo"]),
  discountValue: z.number().min(0),
  feeNotes: z.string().optional(),
  dueDate: z.string().min(1, "Due date required"),
});

type FormData = z.infer<typeof schema>;

function calcDiscount(amount: number, admissionFee: number, type: DiscountType, value: number) {
  const subtotal = amount + admissionFee;
  if (type === "none" || value <= 0) return { discount: 0, total: subtotal };
  let discount = 0;
  if (type === "percent") discount = Math.round((amount * value) / 100);
  else discount = value;
  discount = Math.min(discount, subtotal);
  return { discount, total: Math.max(0, subtotal - discount) };
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      studentId: "",
      planType: "Full Day Monthly",
      amount: 35000,
      admissionFee: 5000,
      discountType: "none",
      discountValue: 0,
      feeNotes: "",
      dueDate: "",
    },
  });

  const amount = watch("amount") || 0;
  const admissionFee = watch("admissionFee") || 0;
  const discountType = watch("discountType");
  const discountValue = watch("discountValue") || 0;

  const { discount, total } = useMemo(
    () => calcDiscount(amount, admissionFee, discountType, discountValue),
    [amount, admissionFee, discountType, discountValue]
  );

  const onSubmit = handleSubmit((data) => {
    const result = calcDiscount(data.amount, data.admissionFee, data.discountType, data.discountValue);
    toast.success(
      `Invoice created · Net ${formatCurrency(result.total)}` +
        (result.discount > 0 ? ` (${formatCurrency(result.discount)} discount)` : "")
    );
    router.push("/billing");
  });

  return (
    <>
      <PageHeader title="Create Invoice" subtitle="Generate a fee invoice with optional discounts" />
      <Card className="max-w-xl">
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Student</Label>
              <Select value={watch("studentId")} onValueChange={(v) => setValue("studentId", v)}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.filter((s) => s.status === "active").map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.studentId && <p className="mt-1 text-xs text-danger">{errors.studentId.message}</p>}
            </div>
            <div>
              <Label htmlFor="planType">Plan Type</Label>
              <Input id="planType" className="mt-1" {...register("planType")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="amount">Tuition (PKR)</Label>
                <Input id="amount" type="number" className="mt-1" {...register("amount", { valueAsNumber: true })} />
                {errors.amount && <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>}
              </div>
              <div>
                <Label htmlFor="admissionFee">Admission fee (PKR)</Label>
                <Input id="admissionFee" type="number" className="mt-1" {...register("admissionFee", { valueAsNumber: true })} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Discount type</Label>
                <Select
                  value={discountType}
                  onValueChange={(v) => {
                    setValue("discountType", v as FormData["discountType"]);
                    if (v === "none") setValue("discountValue", 0);
                  }}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No discount</SelectItem>
                    <SelectItem value="percent">Percent (%)</SelectItem>
                    <SelectItem value="fixed">Fixed amount</SelectItem>
                    <SelectItem value="sibling">Sibling discount</SelectItem>
                    <SelectItem value="scholarship">Scholarship</SelectItem>
                    <SelectItem value="staff">Staff discount</SelectItem>
                    <SelectItem value="promo">Promo / campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discountValue">
                  Discount value {discountType === "percent" ? "(%)" : "(PKR)"}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  min={0}
                  className="mt-1"
                  disabled={discountType === "none"}
                  {...register("discountValue", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="feeNotes">Fee notes (optional)</Label>
              <Textarea
                id="feeNotes"
                className="mt-1"
                rows={2}
                placeholder="e.g. Sibling discount on tuition only; admission fee waived…"
                {...register("feeNotes")}
              />
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" className="mt-1" {...register("dueDate")} />
              {errors.dueDate && <p className="mt-1 text-xs text-danger">{errors.dueDate.message}</p>}
            </div>

            <div className="rounded-2xl bg-bg p-4 text-sm">
              <div className="flex justify-between text-muted">
                <span>Tuition</span>
                <span>{formatCurrency(amount)}</span>
              </div>
              <div className="mt-1 flex justify-between text-muted">
                <span>Admission fee</span>
                <span>{formatCurrency(admissionFee)}</span>
              </div>
              {discount > 0 && (
                <div className="mt-1 flex justify-between font-medium text-brand-700">
                  <span>Discount</span>
                  <span>− {formatCurrency(discount)}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-[#DFE3E8] pt-2 font-bold text-heading">
                <span>Net total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <Button type="submit" className="w-full">Create Invoice</Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

function formatCurrency(amount: number) {
  return `PKR ${Number(amount || 0).toLocaleString()}`;
}
