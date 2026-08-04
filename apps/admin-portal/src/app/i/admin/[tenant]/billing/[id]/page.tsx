import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/billing/StatusPill";
import { ChallanButton } from "@/components/billing/ChallanButton";
import { Button } from "@/components/ui/button";
import {
  getBranches,
  getInvoiceById,
  getParentsByIds,
  getStudentById,
} from "@/lib/mock-service";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  CHALLAN_VALIDITY_DAYS,
  LATE_FEE_AFTER_DUE,
  EXPIRY_SURCHARGE,
  payableAmount,
} from "@/lib/fee-challan";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  const student = await getStudentById(invoice.studentId);
  if (!student) notFound();

  const [parents, branches] = await Promise.all([
    getParentsByIds(student.parentIds),
    getBranches(),
  ]);
  const branch = branches.find((b) => b.id === invoice.branchId);
  const currentPayable = payableAmount(invoice);

  return (
    <>
      <PageHeader
        title={invoice.invoiceNumber}
        subtitle={`${student.firstName} ${student.lastName} · ${invoice.billingMonth}`}
      >
        <ChallanButton
          invoice={invoice}
          student={student}
          parents={parents}
          branchAddress={branch?.address}
        />
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
                  <td className="pt-3 font-semibold">Before due date</td>
                  <td className="pt-3 text-right font-semibold">{formatCurrency(invoice.amount)}</td>
                </tr>
                <tr>
                  <td className="pt-1 text-sm text-muted">
                    After due date (+{formatCurrency(invoice.lateFeeAfterDue)} late fee)
                  </td>
                  <td className="pt-1 text-right text-sm font-medium">
                    {formatCurrency(invoice.amountAfterDue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Challan Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Status</span><StatusPill status={invoice.status} /></div>
            <div className="flex justify-between"><span className="text-gray-500">Consumer #</span><span>{invoice.consumerNumber}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">G.R. Number</span><span>{invoice.grNumber}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Plan</span><span>{invoice.planType}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Issue Date</span><span>{formatDate(invoice.issueDate)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Due Date</span><span>{formatDate(invoice.dueDate)}</span></div>
            <div className="flex justify-between">
              <span className="text-gray-500">Validity ({CHALLAN_VALIDITY_DAYS} days)</span>
              <span>{formatDate(invoice.validityDate)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-gray-500">Payable now</span>
              <span>{formatCurrency(currentPayable)}</span>
            </div>
            {invoice.paidDate && (
              <div className="flex justify-between"><span className="text-gray-500">Paid Date</span><span>{formatDate(invoice.paidDate)}</span></div>
            )}
            {invoice.status === "expired" && (
              <p className="rounded-xl bg-soft-red p-3 text-xs text-danger">
                Voucher expired. Create a new challan; Rs. {(LATE_FEE_AFTER_DUE + EXPIRY_SURCHARGE).toLocaleString()} total late/expiry charges apply as arrears on the next cycle.
              </p>
            )}
            {invoice.feeNotes && (
              <p className="rounded-xl bg-bg p-3 text-xs text-muted">{invoice.feeNotes}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
