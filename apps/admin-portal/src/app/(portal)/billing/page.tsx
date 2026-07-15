import { PageHeader } from "@/components/layout/PageHeader";
import { InvoiceTable } from "@/components/billing/InvoiceTable";
import { getInvoices, getStudents } from "@/lib/mock-service";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default async function BillingPage() {
  const [invoices, students] = await Promise.all([getInvoices(), getStudents()]);
  const studentMap = Object.fromEntries(students.map((s) => [s.id, `${s.firstName} ${s.lastName}`]));
  const totalOutstanding = invoices
    .filter((i) => i.status === "overdue" || i.status === "pending" || i.status === "partial")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <>
      <PageHeader
        title="Billing & Invoices"
        subtitle="Manage fee invoices and payment status"
        action={{ label: "Create Invoice", href: "/billing/create" }}
      />
      <Card className="mb-6">
        <CardContent className="flex items-center justify-between p-4">
          <span className="text-sm text-gray-500">Total Outstanding</span>
          <span className="font-heading text-xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</span>
        </CardContent>
      </Card>
      <InvoiceTable invoices={invoices} students={studentMap} />
    </>
  );
}
