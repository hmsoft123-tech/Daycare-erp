"use client";

import { useEffect, useState } from "react";
import { Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalPortal } from "@/components/ui/modal-portal";
import { recordProgramPayment } from "@/lib/mock-service";
import { todayIso } from "@/lib/fee-challan";
import { formatCurrency } from "@/lib/utils";
import type { PaymentMode, ProgramRegistration } from "@/types";

const selectClass = "mt-1 h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-heading";

export const PAYMENT_MODE_LABEL: Record<PaymentMode, string> = {
  cash: "Cash at campus",
  bank: "Bank (voucher)",
  online: "Online transfer",
  cheque: "Cheque",
};

type Props = {
  registration: ProgramRegistration | null;
  onClose: () => void;
  onSaved: (r: ProgramRegistration) => void;
};

/** Amount / payment record — available whether or not the program uses vouchers */
export function ProgramPaymentModal({ registration, onClose, onSaved }: Props) {
  const balance = registration ? registration.amount - registration.amountPaid : 0;
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<PaymentMode>("cash");
  const [receiptNo, setReceiptNo] = useState("");
  const [paidAt, setPaidAt] = useState(todayIso());

  useEffect(() => {
    if (!registration) return;
    setAmount(String(registration.amount - registration.amountPaid));
    setMode(registration.voucherNumber ? "bank" : "cash");
    setReceiptNo("");
    setPaidAt(todayIso());
  }, [registration]);

  if (!registration) return null;

  const save = async (waive = false) => {
    const result = await recordProgramPayment(registration.id, {
      amount: Number(amount),
      mode,
      receiptNo,
      paidAt,
      waive,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onSaved({ ...result.registration });
    toast.success(waive ? "Fee waived" : `Payment of ${formatCurrency(Number(amount))} recorded`);
    onClose();
  };

  return (
    <ModalPortal open onClose={onClose} maxWidth="max-w-md">
      <div className="flex shrink-0 items-start justify-between border-b border-border px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <Wallet className="h-5 w-5 text-brand-500" />
            Record payment
          </h2>
          <p className="mt-1 text-sm text-muted">
            {registration.studentName} · {registration.registrationNo}
            {registration.voucherNumber ? ` · ${registration.voucherNumber}` : " · no voucher"}
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="space-y-4 px-6 py-5">
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-bg p-3 text-center text-xs">
          <div>
            <p className="text-muted">Amount</p>
            <p className="font-semibold text-heading">{formatCurrency(registration.amount)}</p>
          </div>
          <div>
            <p className="text-muted">Paid</p>
            <p className="font-semibold text-heading">{formatCurrency(registration.amountPaid)}</p>
          </div>
          <div>
            <p className="text-muted">Balance</p>
            <p className="font-semibold text-danger">{formatCurrency(balance)}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="pamt">Amount received</Label>
            <Input id="pamt" type="number" min={1} max={balance} className="mt-1" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label>Mode</Label>
            <select className={selectClass} value={mode} onChange={(e) => setMode(e.target.value as PaymentMode)}>
              {(Object.keys(PAYMENT_MODE_LABEL) as PaymentMode[]).map((m) => (
                <option key={m} value={m}>{PAYMENT_MODE_LABEL[m]}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="prcpt">Receipt no.</Label>
            <Input id="prcpt" className="mt-1" value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)} placeholder="Auto if blank" />
          </div>
          <div>
            <Label htmlFor="pdate">Paid on</Label>
            <Input id="pdate" type="date" className="mt-1" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="flex justify-between gap-3 border-t border-border px-6 py-4">
        <Button type="button" variant="ghost" onClick={() => save(true)}>Waive fee</Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={() => save(false)}>Save payment</Button>
        </div>
      </div>
    </ModalPortal>
  );
}
