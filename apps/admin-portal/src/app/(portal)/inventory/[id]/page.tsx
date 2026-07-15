import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPurchaseRequisitionById } from "@/lib/mock-service";
import { branches } from "@/data/branches";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RequisitionDetailPage({ params }: Props) {
  const { id } = await params;
  const pr = await getPurchaseRequisitionById(id);
  if (!pr) notFound();

  const branch = branches.find((b) => b.id === pr.branchId);

  return (
    <>
      <PageHeader title={pr.summary} subtitle={`Requested by ${pr.requestedBy}`} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Item</th>
                  <th className="pb-2">Qty</th>
                  <th className="pb-2 text-right">Unit Price</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {pr.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">{item.item}</td>
                    <td className="py-3">{item.qty}</td>
                    <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 text-right">{formatCurrency(item.qty * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Status</span><Badge className="capitalize">{pr.status}</Badge></div>
            <div className="flex justify-between"><span className="text-gray-500">Branch</span><span>{branch?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{formatDate(pr.date)}</span></div>
            {pr.vendor && <div className="flex justify-between"><span className="text-gray-500">Vendor</span><span>{pr.vendor}</span></div>}
            <div className="flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(pr.totalAmount)}</span></div>
            <Button variant="outline" asChild className="w-full">
              <Link href="/inventory">← Back to inbox</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
