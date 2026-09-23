"use client";

import { useEffect, useRef } from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHALLAN_BANK, formatChallanDate } from "@/lib/fee-challan";

export type PaymentVoucherData = {
  /** e.g. "Special Program Voucher" / "Course & Books Voucher" */
  title: string;
  voucherNumber: string;
  issueDate: string;
  dueDate: string;
  branchName: string;
  payer: {
    name: string;
    /** "G.R. No." for enrolled students, "Reg. No." for outside children */
    idLabel: string;
    idValue: string;
    parentName: string;
    contact: string;
    /** Class / program line */
    context?: string;
  };
  lines: { label: string; qty?: number; amount: number }[];
  /** Already paid (partial payments) */
  paid?: number;
  note?: string;
};

const COPIES = [
  { label: "Bank Copy", accent: "#3B82F6", text: "#ffffff" },
  { label: "Parent's Copy", accent: "#A3E635", text: "#14532D" },
  { label: "School's Copy", accent: "#22C55E", text: "#ffffff" },
];

const money = (n: number) => n.toLocaleString("en-PK");

function VoucherCopy({ v, copy }: { v: PaymentVoucherData; copy: (typeof COPIES)[number] }) {
  const total = v.lines.reduce((s, l) => s + l.amount, 0);
  const payable = Math.max(0, total - (v.paid ?? 0));
  return (
    <div className="challan-pane flex h-full flex-col border border-black/70 bg-white text-black" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div className="px-2 py-1 text-center text-[10px] font-bold" style={{ backgroundColor: copy.accent, color: copy.text }}>
        {copy.label}
      </div>
      <div className="border-b border-black/40 px-2 py-1.5 text-center">
        <p className="text-[11px] font-bold leading-tight">{CHALLAN_BANK.schoolName}</p>
        <p className="text-[9px]">{v.branchName}</p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide">{v.title}</p>
      </div>
      <div className="space-y-0.5 border-b border-black/40 px-2 py-1.5 text-[9.5px]">
        <Row k="Voucher No." v={v.voucherNumber} bold />
        <Row k="Issue Date" v={formatChallanDate(v.issueDate)} />
        <Row k="Due Date" v={formatChallanDate(v.dueDate)} bold />
        <Row k="Student" v={v.payer.name.toUpperCase()} bold />
        <Row k={v.payer.idLabel} v={v.payer.idValue} />
        <Row k="Parent" v={v.payer.parentName} />
        <Row k="Contact" v={v.payer.contact} />
        {v.payer.context && <Row k="Program" v={v.payer.context} />}
      </div>
      <table className="w-full text-[9.5px]">
        <thead>
          <tr style={{ backgroundColor: copy.accent, color: copy.text }}>
            <th className="px-2 py-0.5 text-left">Particulars</th>
            <th className="px-1 py-0.5 text-right">Qty</th>
            <th className="px-2 py-0.5 text-right">Rs.</th>
          </tr>
        </thead>
        <tbody>
          {v.lines.map((l, i) => (
            <tr key={i} className="border-b border-black/10">
              <td className="px-2 py-0.5">{l.label}</td>
              <td className="px-1 py-0.5 text-right">{l.qty ?? 1}</td>
              <td className="px-2 py-0.5 text-right">{money(l.amount)}</td>
            </tr>
          ))}
          {(v.paid ?? 0) > 0 && (
            <tr>
              <td className="px-2 py-0.5 italic" colSpan={2}>Less: already paid</td>
              <td className="px-2 py-0.5 text-right">({money(v.paid!)})</td>
            </tr>
          )}
          <tr className="font-bold">
            <td className="px-2 py-1" colSpan={2}>Total payable</td>
            <td className="px-2 py-1 text-right">{money(payable)}</td>
          </tr>
        </tbody>
      </table>
      <div className="mt-auto space-y-0.5 border-t border-black/40 px-2 py-1.5 text-[8.5px]">
        <p>
          Pay at {CHALLAN_BANK.bankName} {CHALLAN_BANK.branchNote} · A/C {CHALLAN_BANK.collectionAccountNo}
        </p>
        <p>Or pay at the campus office against a receipt.</p>
        {v.note && <p className="italic">{v.note}</p>}
        <div className="flex justify-between pt-3">
          <span>Cashier / Bank stamp</span>
          <span>Officer</span>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span>{k}</span>
      <span className={bold ? "text-right font-bold" : "text-right"}>{v}</span>
    </div>
  );
}

/** Full-screen preview with print — reuses the fee-challan print stylesheet (A4 landscape, 3 copies). */
export function PaymentVoucherModal({ voucher, onClose }: { voucher: PaymentVoucherData | null; onClose: () => void }) {
  const previousTitle = useRef("");

  useEffect(() => {
    const restore = () => {
      if (previousTitle.current) document.title = previousTitle.current;
    };
    window.addEventListener("afterprint", restore);
    return () => window.removeEventListener("afterprint", restore);
  }, []);

  if (!voucher) return null;

  const print = () => {
    previousTitle.current = document.title;
    document.title = `${voucher.title} · ${voucher.payer.name} · ${voucher.voucherNumber}`;
    requestAnimationFrame(() => setTimeout(() => window.print(), 80));
  };

  return (
    <div className="challan-print-root fixed inset-0 z-50 flex flex-col bg-black/50 print:static print:bg-white">
      <div className="flex items-center justify-between gap-3 bg-surface px-4 py-3 shadow print:hidden">
        <div>
          <p className="font-heading text-sm font-bold text-heading">{voucher.title}</p>
          <p className="text-xs text-muted">
            {voucher.voucherNumber} · {voucher.payer.name} · due {formatChallanDate(voucher.dueDate)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={print}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 print:overflow-visible print:p-0">
        <div className="fee-challan mx-auto max-w-[1100px] print:max-w-none">
          <div className="challan-sheet challan-sheet-terms grid grid-cols-3 gap-2 bg-white p-2">
            {COPIES.map((c) => (
              <VoucherCopy key={c.label} v={voucher} copy={c} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
