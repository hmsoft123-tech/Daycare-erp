"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const printAfterOpen = useRef(false);
  const previousTitle = useRef<string>("");

  const expired =
    invoice.status === "expired" || isChallanExpired(invoice.validityDate);

  const ensureValid = () => {
    if (expired) {
      toast.error(
        `Challan expired on ${invoice.validityDate}. Generate a new invoice — expiry surcharge Rs. ${invoice.expirySurcharge.toLocaleString()} will apply as arrears.`
      );
      return false;
    }
    return true;
  };

  const runPrint = useCallback(() => {
    previousTitle.current = document.title;
    const name = `${student.firstName} ${student.lastName}`.toUpperCase();
    document.title = `Fee Challan · ${name} · ${invoice.consumerNumber}`;
    // Let layout settle (landscape CSS + colors) before dialog
    requestAnimationFrame(() => {
      setTimeout(() => window.print(), 80);
    });
  }, [invoice.consumerNumber, student.firstName, student.lastName]);

  useEffect(() => {
    if (!open || !printAfterOpen.current) return;
    printAfterOpen.current = false;
    runPrint();
  }, [open, runPrint]);

  useEffect(() => {
    const restore = () => {
      if (previousTitle.current) document.title = previousTitle.current;
    };
    window.addEventListener("afterprint", restore);
    return () => window.removeEventListener("afterprint", restore);
  }, []);

  const handlePreview = () => {
    if (!ensureValid()) return;
    printAfterOpen.current = false;
    setOpen(true);
  };

  const handlePrint = () => {
    if (!ensureValid()) return;
    if (open) {
      runPrint();
      return;
    }
    printAfterOpen.current = true;
    setOpen(true);
  };

  return (
    <>
      <Button variant="outline" onClick={handlePreview}>
        <FileText className="h-4 w-4" />
        Generate Challan
      </Button>
      <Button onClick={handlePrint} disabled={expired}>
        <Printer className="h-4 w-4" />
        Print Challan
      </Button>

      {open && (
        <div className="challan-print-root fixed inset-0 z-50 flex flex-col bg-black/50 print:static print:inset-auto print:z-auto print:bg-white">
          <div className="flex items-center justify-between gap-3 bg-white px-4 py-3 shadow print:hidden">
            <div>
              <p className="font-heading text-sm font-bold text-heading">Fee Challan Preview</p>
              <p className="text-xs text-muted">
                {invoice.invoiceNumber} · Consumer #{invoice.consumerNumber} · Valid until{" "}
                {invoice.validityDate}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  printAfterOpen.current = false;
                  setOpen(false);
                }}
              >
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 print:overflow-visible print:p-0">
            <div className="mx-auto max-w-[1100px] print:max-w-none">
              <p className="mb-2 text-xs text-muted print:hidden">
                Bank Al Habib format — use <strong>Print</strong> or <strong>Print Challan</strong>.
                Choose <strong>A4 Landscape</strong> and enable <strong>Background graphics</strong>.
              </p>
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
