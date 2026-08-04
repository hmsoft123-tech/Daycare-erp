"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FeeChallan } from "@/components/billing/FeeChallan";
import type { Invoice, Parent, Student } from "@/types";
import { FileText, Printer, X } from "lucide-react";
import { isChallanExpired } from "@/lib/fee-challan";
import { toast } from "sonner";

interface ChallanButtonProps {
  invoice: Invoice;
  student: Student;
  parents: Parent[];
  branchAddress?: string;
}

export function ChallanButton({ invoice, student, parents, branchAddress }: ChallanButtonProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    if (invoice.status === "expired" || isChallanExpired(invoice.validityDate)) {
      toast.error(
        `Challan expired on ${invoice.validityDate}. Generate a new invoice — expiry surcharge Rs. ${invoice.expirySurcharge.toLocaleString()} will apply as arrears.`
      );
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <Button variant="outline" onClick={handleOpen}>
        <FileText className="h-4 w-4" />
        Generate Challan
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/50 print:static print:inset-auto print:bg-white">
          <div className="flex items-center justify-between gap-3 bg-white px-4 py-3 shadow print:hidden">
            <div>
              <p className="font-heading text-sm font-bold text-heading">Fee Challan Preview</p>
              <p className="text-xs text-muted">
                {invoice.invoiceNumber} · Valid until {invoice.validityDate} (25-day window)
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 print:overflow-visible print:p-0">
            <div className="mx-auto max-w-3xl print:max-w-none">
              <FeeChallan
                invoice={invoice}
                student={student}
                parents={parents}
                branchAddress={branchAddress}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
