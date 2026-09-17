"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdmissionFollowUpEntry, InquiryFollowUpOutcome, InquiryFollowUpStatus } from "@/types";
import { saveAdmissionFollowUp } from "@/lib/mock-service";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_OPTIONS: { id: InquiryFollowUpStatus; label: string }[] = [
  { id: "welcome_sent", label: "1. Welcome / initial inquiry" },
  { id: "post_meeting", label: "2. Post-meeting follow-up" },
  { id: "final", label: "3. Final follow-up / result" },
];

const OUTCOME_OPTIONS: { id: InquiryFollowUpOutcome; label: string }[] = [
  { id: "admission_done", label: "Admission done" },
  { id: "not_interested", label: "Not interested" },
  { id: "deferred", label: "Admission deferred" },
  { id: "no_response", label: "No response" },
  { id: "other", label: "Other reason" },
];

type Props = {
  admissionId: string;
  initialStatus?: InquiryFollowUpStatus;
  initialOutcome?: InquiryFollowUpOutcome;
  initialNotes?: string;
  initialHistory?: AdmissionFollowUpEntry[];
};

export function InquiryFollowUpPanel({
  admissionId,
  initialStatus,
  initialOutcome,
  initialNotes,
  initialHistory,
}: Props) {
  const [status, setStatus] = useState<InquiryFollowUpStatus>(initialStatus ?? "welcome_sent");
  const [outcome, setOutcome] = useState<InquiryFollowUpOutcome | "">(initialOutcome ?? "");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [history, setHistory] = useState<AdmissionFollowUpEntry[]>(initialHistory ?? []);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (status === "final" && !outcome) {
      toast.error("Select a final outcome");
      return;
    }
    if (status === "final" && outcome !== "admission_done" && !notes.trim()) {
      toast.error("Record feedback / reason when admission is not completed");
      return;
    }
    setSaving(true);
    const result = await saveAdmissionFollowUp(admissionId, {
      status,
      outcome: outcome || undefined,
      notes: notes.trim() || undefined,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setHistory(result.admission.followUpHistory ?? []);
    toast.success("Follow-up updated");
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div>
        <h3 className="text-sm font-bold text-heading">Inquiry follow-up</h3>
        <p className="text-xs text-muted">Welcome → post-meeting → final admission result</p>
      </div>
      {history.length > 0 && (
        <div className="space-y-2 rounded-xl border border-border bg-bg p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Follow-up history</p>
          <ul className="space-y-2">
            {[...history].reverse().map((entry, i) => (
              <li key={i} className="text-xs">
                <span className="font-medium text-heading">
                  {STATUS_OPTIONS.find((o) => o.id === entry.status)?.label ?? entry.status}
                </span>
                {entry.outcome && (
                  <span className="text-muted">
                    {" "}
                    · {OUTCOME_OPTIONS.find((o) => o.id === entry.outcome)?.label ?? entry.outcome}
                  </span>
                )}
                <span className="text-muted"> · {formatDate(entry.savedAt)} · {entry.savedBy}</span>
                {entry.notes && <p className="mt-0.5 text-muted">{entry.notes}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <Label>Follow-up stage</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as InquiryFollowUpStatus)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {status === "final" && (
        <div>
          <Label>Final outcome</Label>
          <Select value={outcome} onValueChange={(v) => setOutcome(v as InquiryFollowUpOutcome)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select outcome" />
            </SelectTrigger>
            <SelectContent>
              {OUTCOME_OPTIONS.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label htmlFor="fu-notes">Notes / feedback</Label>
        <Textarea
          id="fu-notes"
          className="mt-1"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Reason if not admitted, parent comments…"
        />
      </div>
      <Button type="button" onClick={() => void save()} disabled={saving}>
        {saving ? "Saving…" : "Save follow-up"}
      </Button>
    </div>
  );
}
