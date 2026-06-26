import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStaff } from "@/lib/mock-service";
import { formatCurrency } from "@/lib/utils";
import { PayrollClient } from "./PayrollClient";

export default async function PayrollPage() {
  const staff = await getStaff();

  const payroll = staff.map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role,
    branchId: s.branchId,
    baseSalary: s.role === "executive" ? 250000 : s.role === "therapist" ? 120000 : s.role === "teacher" ? 85000 : 65000,
    deductions: 5000,
  }));

  const totalPayroll = payroll.reduce((sum, p) => sum + p.baseSalary - p.deductions, 0);

  return (
    <>
      <PageHeader title="Payroll" subtitle={`Total monthly disbursement: ${formatCurrency(totalPayroll)}`} />
      <Card className="mb-6">
        <CardHeader><CardTitle>June 2025 Payroll Run</CardTitle></CardHeader>
        <CardContent>
          <PayrollClient payroll={payroll} />
        </CardContent>
      </Card>
    </>
  );
}
