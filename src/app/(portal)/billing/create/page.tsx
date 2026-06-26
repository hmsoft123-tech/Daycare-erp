"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const schema = z.object({
  studentId: z.string().min(1),
  planType: z.string().min(1),
  amount: z.number().min(1000),
  dueDate: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

export default function CreateInvoicePage() {
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { studentId: "", planType: "Full Day Monthly", amount: 35000, dueDate: "" },
  });

  const onSubmit = handleSubmit((data) => {
    toast.success(`Invoice created for ${formatCurrency(data.amount)}`);
    router.push("/billing");
  });

  return (
    <>
      <PageHeader title="Create Invoice" subtitle="Generate a new fee invoice" />
      <Card className="max-w-lg">
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
              {errors.studentId && <p className="mt-1 text-xs text-red-600">{errors.studentId.message}</p>}
            </div>
            <div>
              <Label htmlFor="planType">Plan Type</Label>
              <Input id="planType" {...register("planType")} />
            </div>
            <div>
              <Label htmlFor="amount">Amount (PKR)</Label>
              <Input id="amount" type="number" {...register("amount", { valueAsNumber: true })} />
              {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
            </div>
            <Button type="submit" className="w-full">Create Invoice</Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

function formatCurrency(amount: number) {
  return `PKR ${amount.toLocaleString()}`;
}
