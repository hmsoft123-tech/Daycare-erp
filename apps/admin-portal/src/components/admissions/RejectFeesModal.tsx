"use client";

import { useEffect, useState } from "react";
import { Loader2, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModalPortal } from "@/components/ui/modal-portal";

type Props = {
  open: boolean;
  childName: string;
  /** Who is rejecting, for the subtitle */
  levelLabel: string;
  saving?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
};

/** Reason prompt for rejecting a proposed fee package — the inquiry goes back to Tour Scheduled. */
export function RejectFeesModal({ open, childName, levelLabel, saving = false, onCancel, onConfirm }: Props) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setReason("");
    setError("");
  }, [open]);

  const submit = () => {
    const text = reason.trim();
    if (text.length < 3) return setError("Tell staff why, so they can re-propose the fees.");
    onConfirm(text);
  };

  return (
    <ModalPortal open={open} onClose={saving ? () => {} : onCancel} closeOnBackdrop={!saving}>
      <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <XCircle className="h-5 w-5 text-danger" />
            Reject fees
          </h2>
          <p className="mt-1 text-sm text-muted">
            <span className="font-semibold text-heading">{childName}</span> — {levelLabel}. The inquiry
            moves back to Tour Scheduled so staff can discuss and re-propose.
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
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-6 py-5">
        <Label htmlFor="rejectionReason">Reason</Label>
        <Textarea
          id="rejectionReason"
          rows={3}
          maxLength={500}
          placeholder="e.g. Parent requested a higher sibling discount"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
      <div className="flex shrink-0 justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
        <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" variant="destructive" disabled={saving} onClick={submit}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Reject fees
        </Button>
      </div>
    </ModalPortal>
  );
}
