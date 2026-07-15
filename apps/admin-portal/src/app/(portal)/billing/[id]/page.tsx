import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/billing/StatusPill";
import { ChallanButton } from "@/components/billing/ChallanButton";
import { Button } from "@/components/ui/button";
import { getInvoiceById, getStudentById } from "@/lib/mock-service";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  const student = await getStudentById(invoice.studentId);

  return (
    <>
      <PageHeader title={invoice.invoiceNumber} subtitle={student ? `${student.firstName} ${student.lastName}` : invoice.studentId}>
        <ChallanButton invoiceNumber={invoice.invoiceNumber} amount={invoice.amount} />
        <Button variant="outline" asChild>
          <Link href="/billing">← Back</Link>
        </Button>
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">{item.description}</td>
                    <td className="py-3 text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="pt-3 font-semibold">Total</td>
                  <td className="pt-3 text-right font-semibold">{formatCurrency(invoice.amount)}</td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Status</span><StatusPill status={invoice.status} /></div>
            <div className="flex justify-between"><span className="text-gray-500">Plan</span><span>{invoice.planType}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Due Date</span><span>{formatDate(invoice.dueDate)}</span></div>
            {invoice.paidDate && (
              <div className="flex justify-between"><span className="text-gray-500">Paid Date</span><span>{formatDate(invoice.paidDate)}</span></div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
