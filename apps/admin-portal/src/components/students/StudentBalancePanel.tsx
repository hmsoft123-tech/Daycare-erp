"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCan } from "@/components/security/Can";
import { useApiClient } from "@/lib/api";
import { apiErrorMessage } from "@/lib/admissions-api";
import {
  LEDGER_TYPE_LABELS,
  MANUAL_LEDGER_TYPES,
  balancePath,
  type ApiStudentBalance,
  type LedgerTransactionType,
} from "@/lib/students-api";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type Direction = "credit" | "debit";

/** Usual direction per type — staff can still change it, and the confirm step shows the signed amount. */
const DEFAULT_DIRECTION: Record<LedgerTransactionType, Direction> = {
  ADVANCE_PAYMENT: "credit",
  OVERPAYMENT_CREDIT: "credit",
  CREDIT_ADJUSTMENT: "credit",
  REFUND: "debit",
  CHALLAN_DEBIT: "debit",
};

/** Signed money: "+PKR 200" / "−PKR 200". */
const signed = (n: number) => `${n < 0 ? "−" : "+"}${formatCurrency(Math.abs(n))}`;

/**
 * Student credit balance: `GET /fees/students/{id}/balance` (balance + ledger,
 * newest first) and `POST` to record an advance payment or adjustment. The
 * balance shown is always the server's — never summed in the browser.
 */
export function StudentBalancePanel({ studentId }: { studentId: string }) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const canRecord = useCan("fees.balance");

  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [type, setType] = useState<LedgerTransactionType>("ADVANCE_PAYMENT");
  const [direction, setDirection] = useState<Direction>("credit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [challanNumber, setChallanNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const queryKey = ["student-balance", studentId];
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () => api.get<ApiStudentBalance>(balancePath(studentId)),
  });
  const balance = data?.currentBalance ?? 0;
  const ledger = data?.ledger ?? [];

  const signedAmount = (direction === "debit" ? -1 : 1) * Number(amount);

  const openForm = () => {
    setType("ADVANCE_PAYMENT");
    setDirection("credit");
    setAmount("");
    setDescription("");
    setChallanNumber("");
    setErrors({});
    setConfirming(false);
    setOpen(true);
  };

  const review = () => {
    const next: Record<string, string> = {};
    const n = Number(amount);
    if (!amount.trim() || !Number.isFinite(n) || n <= 0) next.amount = "Enter an amount above 0";
    else if (Math.round(n * 100) !== n * 100) next.amount = "At most 2 decimal places";
    if (description.trim().length < 5) next.description = "Describe what this entry is for";
    setErrors(next);
    if (!Object.keys(next).length) setConfirming(true);
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.post<ApiStudentBalance>(balancePath(studentId), {
        amount: signedAmount,
        transactionType: type,
        description: description.trim(),
        challanNumber: challanNumber.trim() || undefined,
      });
      toast.success(`Recorded. Balance is now ${formatCurrency(r?.currentBalance ?? 0)}.`);
      setOpen(false);
      if (r) queryClient.setQueryData(queryKey, r);
      void queryClient.invalidateQueries({ queryKey });
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not record the entry."));
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-heading">
              <Wallet className="h-4 w-4 text-brand-500" />
              Credit balance
            </h3>
            <p className="text-xs text-muted">
              Advance payments and credits. Monthly challan generation deducts available credit automatically.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => void refetch()} disabled={isFetching}>
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
              Refresh
            </Button>
            {canRecord && (
              <Button size="sm" onClick={openForm}>
                <Plus className="h-4 w-4" />
                Record entry
              </Button>
            )}
          </div>
        </div>

        {isPending ? (
          <p className="flex items-center gap-2 py-6 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading balance…
          </p>
        ) : isError ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-danger">{apiErrorMessage(error, "Could not load the balance.")}</span>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-bg p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Available credit</p>
              <p className={cn("font-heading text-2xl font-bold", balance < 0 ? "text-danger" : "text-heading")}>
                {formatCurrency(balance)}
              </p>
              <p className="text-xs text-muted">
                {balance > 0
                  ? "The student has credit — it is applied to the next challan."
                  : balance < 0
                    ? "Negative balance — more has been debited than credited."
                    : "No credit available."}
              </p>
            </div>

            {ledger.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">No ledger entries yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="py-2 pr-4 font-semibold">Date</th>
                      <th className="py-2 pr-4 font-semibold">Type</th>
                      <th className="py-2 pr-4 font-semibold">Description</th>
                      <th className="py-2 pr-4 font-semibold">Recorded by</th>
                      <th className="py-2 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F3F5]">
                    {ledger.map((e) => (
                      <tr key={e.id}>
                        <td className="whitespace-nowrap py-2 pr-4 text-xs">
                          {e.createdAt ? formatDate(e.createdAt, "dd MMM yyyy, HH:mm") : "—"}
                        </td>
                        <td className="py-2 pr-4">{e.transactionType ? LEDGER_TYPE_LABELS[e.transactionType] ?? e.transactionType : "—"}</td>
                        <td className="py-2 pr-4 text-xs">
                          {e.description || "—"}
                          {e.challanNumber && <span className="block font-mono text-[11px] text-muted">{e.challanNumber}</span>}
                        </td>
                        <td className="py-2 pr-4 text-xs">{e.recordedBy || "—"}</td>
                        <td className={cn("py-2 text-right font-medium", (e.amount ?? 0) < 0 ? "text-danger" : "text-emerald-700")}>
                          {signed(e.amount ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </CardContent>

      <ModalPortal open={open} onClose={busy ? () => {} : () => setOpen(false)} closeOnBackdrop={!busy}>
        <div className="border-b border-[#F1F3F5] px-6 py-5">
          <h2 className="font-heading text-lg font-bold text-heading">
            {confirming ? "Confirm ledger entry" : "Record ledger entry"}
          </h2>
          <p className="mt-1 text-sm text-muted">Current balance {formatCurrency(balance)}</p>
        </div>
        {confirming ? (
          <div className="space-y-2 px-6 py-5 text-sm">
            <p>
              <span className="text-muted">Type:</span> {LEDGER_TYPE_LABELS[type]}
            </p>
            <p>
              <span className="text-muted">Amount sent:</span>{" "}
              <span className={cn("font-bold", signedAmount < 0 ? "text-danger" : "text-emerald-700")}>{signed(signedAmount)}</span>{" "}
              ({direction === "credit" ? "adds credit" : "removes credit"})
            </p>
            <p>
              <span className="text-muted">Description:</span> {description.trim()}
            </p>
            {challanNumber.trim() && (
              <p>
                <span className="text-muted">Challan:</span> {challanNumber.trim()}
              </p>
            )}
            <p className="pt-2 text-xs text-muted">Ledger entries cannot be edited — a mistake needs a correcting entry.</p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => {
                    setType(v as LedgerTransactionType);
                    setDirection(DEFAULT_DIRECTION[v as LedgerTransactionType]);
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MANUAL_LEDGER_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {LEDGER_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Effect</Label>
                <Select value={direction} onValueChange={(v) => setDirection(v as Direction)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Adds credit (+)</SelectItem>
                    <SelectItem value="debit">Removes credit (−)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ledgerAmount">Amount (PKR)</Label>
                <Input
                  id="ledgerAmount"
                  className="mt-1"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {errors.amount && <p className="mt-1 text-xs text-danger">{errors.amount}</p>}
              </div>
              <div>
                <Label htmlFor="ledgerChallan">Challan number (optional)</Label>
                <Input
                  id="ledgerChallan"
                  className="mt-1 font-mono"
                  value={challanNumber}
                  onChange={(e) => setChallanNumber(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ledgerDesc">Description</Label>
              <Textarea
                id="ledgerDesc"
                className="mt-1"
                rows={2}
                maxLength={300}
                placeholder="e.g. Advance paid in cash for December tuition"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              {errors.description && <p className="mt-1 text-xs text-danger">{errors.description}</p>}
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
          <Button variant="outline" disabled={busy} onClick={() => (confirming ? setConfirming(false) : setOpen(false))}>
            {confirming ? "Back" : "Cancel"}
          </Button>
          {confirming ? (
            <Button disabled={busy} onClick={() => void submit()}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Record entry
            </Button>
          ) : (
            <Button onClick={review}>Review</Button>
          )}
        </div>
      </ModalPortal>
    </Card>
  );
}
