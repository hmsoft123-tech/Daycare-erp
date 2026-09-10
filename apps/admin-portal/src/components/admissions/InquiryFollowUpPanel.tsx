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
import type { InquiryFollowUpOutcome, InquiryFollowUpStatus } from "@/types";
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
  initialStatus?: InquiryFollowUpStatus;
  initialOutcome?: InquiryFollowUpOutcome;
  initialNotes?: string;
};

export function InquiryFollowUpPanel({ initialStatus, initialOutcome, initialNotes }: Props) {
  const [status, setStatus] = useState<InquiryFollowUpStatus>(initialStatus ?? "welcome_sent");
  const [outcome, setOutcome] = useState<InquiryFollowUpOutcome | "">(initialOutcome ?? "");
  const [notes, setNotes] = useState(initialNotes ?? "");

  const save = () => {
    if (status === "final" && !outcome) {
      toast.error("Select a final outcome");
      return;
    }
    if (status === "final" && outcome !== "admission_done" && !notes.trim()) {
      toast.error("Record feedback / reason when admission is not completed");
      return;
    }
    toast.success("Follow-up updated (demo)");
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div>
        <h3 className="text-sm font-bold text-heading">Inquiry follow-up</h3>
        <p className="text-xs text-muted">Welcome → post-meeting → final admission result</p>
      </div>
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
      <Button type="button" onClick={save}>
        Save follow-up
      </Button>
    </div>
  );
}
