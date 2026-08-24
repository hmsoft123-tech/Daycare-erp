import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PayrollClient } from "@/components/hr/PayrollClient";
import { PayrollExtrasPanel } from "@/components/hr/PayrollExtrasPanel";
import { getPayableStaff } from "@/lib/mock-service";
import { buildPayrollBreakdown, netMonthlyPay, ensureSalary } from "@/lib/salary-determination";
import { formatCurrency } from "@/lib/utils";

export default async function PayrollPage() {
  const staffList = await getPayableStaff();
  const payroll = staffList.map((s) => buildPayrollBreakdown(s));
  const totalPayroll = staffList.reduce((sum, s) => sum + netMonthlyPay(ensureSalary(s)), 0);

  return (
    <>
      <PageHeader
        title="Payroll"
        subtitle={`Active staff only · Disbursement window 10th–15th · Total: ${formatCurrency(totalPayroll)}`}
      />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monthly payroll run</CardTitle>
        </CardHeader>
        <CardContent>
          <PayrollClient payroll={payroll} />
        </CardContent>
      </Card>
      <PayrollExtrasPanel />
    </>
  );
}
