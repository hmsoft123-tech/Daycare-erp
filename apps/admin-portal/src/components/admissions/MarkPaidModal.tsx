"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PAYMENT_METHODS,
  type ApiPaymentMethod,
  type PaymentConfirmation,
} from "@/lib/admissions-api";
import { formatCurrency } from "@/lib/utils";

type Props = {
  open: boolean;
  studentName: string;
  challanNumber?: string;
  /** Pre-fills the amount received */
  amountDue?: number;
  saving?: boolean;
  onCancel: () => void;
  onConfirm: (payment: PaymentConfirmation) => void;
};

/**
 * Enrolled Unpaid → Enrolled. Asks whether the fee was received and how, then
 * asks once more before `POST /admissions/enrollments/{identifier}/mark-paid`.
 */
export function MarkPaidModal({
  open,
  studentName,
  challanNumber,
  amountDue,
  saving = false,
  onCancel,
  onConfirm,
}: Props) {
  const [method, setMethod] = useState<ApiPaymentMethod>("CASH");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [received, setReceived] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMethod("CASH");
    setReference("");
    setAmount(amountDue ? String(amountDue) : "");
    setNotes("");
    setReceived(false);
    setConfirming(false);
    setError(null);
  }, [open, amountDue]);

  const review = () => {
    const paid = Number(amount);
    if (!received) return setError("Confirm that the fee has been received before enrolling.");
    if (!amount || Number.isNaN(paid) || paid <= 0) return setError("Enter the amount received.");
    if (method !== "CASH" && !reference.trim()) {
      return setError("Enter the transaction / cheque reference.");
    }
    setError(null);
    setConfirming(true);
  };

  const submit = () =>
    onConfirm({
      paymentMethod: method,
      transactionReference: reference.trim() || undefined,
      amountPaid: Number(amount),
      paymentNotes: notes.trim() || undefined,
    });

  const methodLabel = PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;

  return (
    <ModalPortal open={open} onClose={saving ? () => {} : onCancel} closeOnBackdrop={!saving}>
      <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <BadgeCheck className="h-5 w-5 text-brand-500" />
            {confirming ? "Confirm enrollment" : "Mark fee as paid"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            <span className="font-semibold text-heading">{studentName}</span>
            {challanNumber ? ` · challan ${challanNumber}` : ""}
            {amountDue ? ` · due ${formatCurrency(amountDue)}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-full p-2 text-muted hover:bg-bg"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {confirming ? (
        <div className="space-y-3 px-6 py-5 text-sm">
          <p className="text-heading">
            Has the fee really been paid? Confirming marks the challan as paid, moves{" "}
            <span className="font-semibold">{studentName}</span> to <b>Enrolled</b> and activates the
            student profile. This cannot be undone from the pipeline.
          </p>
          <dl className="space-y-1 rounded-xl bg-bg px-4 py-3">
            <div className="flex justify-between">
              <dt className="text-muted">Amount received</dt>
              <dd className="font-semibold text-heading">{formatCurrency(Number(amount))}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Method</dt>
              <dd className="font-medium text-heading">{methodLabel}</dd>
            </div>
            {reference.trim() && (
              <div className="flex justify-between">
                <dt className="text-muted">Reference</dt>
                <dd className="font-medium text-heading">{reference.trim()}</dd>
              </div>
            )}
          </dl>
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Payment method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as ApiPaymentMethod)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amountPaid">Amount received (PKR)</Label>
              <Input
                id="amountPaid"
                type="number"
                min={0}
                className="mt-1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="transactionReference">
              Transaction reference{method === "CASH" ? " (optional)" : ""}
            </Label>
            <Input
              id="transactionReference"
              className="mt-1"
              placeholder="e.g. TXN-HBL-9921049"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="paymentNotes">Notes</Label>
            <Textarea
              id="paymentNotes"
              className="mt-1"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <label className="flex items-start gap-2 text-sm text-heading">
            <Checkbox
              checked={received}
              onCheckedChange={(v) => setReceived(v === true)}
              className="mt-0.5"
            />
            I confirm the fee for this challan has been received.
          </label>
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      )}

      <div className="flex shrink-0 justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
        {confirming ? (
          <>
            <Button type="button" variant="outline" disabled={saving} onClick={() => setConfirming(false)}>
              Back
            </Button>
            <Button type="button" disabled={saving} onClick={submit}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Yes, fee paid — enroll
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={review}>
              Continue
            </Button>
          </>
        )}
      </div>
    </ModalPortal>
  );
}
