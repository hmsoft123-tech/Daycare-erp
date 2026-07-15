"use client";

import { useState } from "react";
import { CalendarClock, X } from "lucide-react";
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
import type { StaffInquiryCard, StaffInterviewKind } from "@/types";

export type ScheduleInterviewValues = {
  interviewKind: StaffInterviewKind;
  interviewDate: string;
  interviewTime: string;
  interviewLocation: string;
  interviewNotes: string;
};

type Props = {
  open: boolean;
  card: StaffInquiryCard | null;
  onCancel: () => void;
  onConfirm: (values: ScheduleInterviewValues) => void;
};

export function ScheduleInterviewModal({ open, card, onCancel, onConfirm }: Props) {
  const [interviewKind, setInterviewKind] = useState<StaffInterviewKind>("in_person");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("11:00");
  const [interviewLocation, setInterviewLocation] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetAndClose = () => {
    setInterviewKind("in_person");
    setInterviewDate("");
    setInterviewTime("11:00");
    setInterviewLocation("");
    setInterviewNotes("");
    setErrors({});
    onCancel();
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (!interviewDate) next.interviewDate = "Date required";
    if (!interviewTime) next.interviewTime = "Time required";
    if (!interviewLocation.trim()) next.interviewLocation = "Location required";
    setErrors(next);
    if (Object.keys(next).length) return;
    onConfirm({
      interviewKind,
      interviewDate,
      interviewTime,
      interviewLocation: interviewLocation.trim(),
      interviewNotes: interviewNotes.trim(),
    });
    setInterviewKind("in_person");
    setInterviewDate("");
    setInterviewTime("11:00");
    setInterviewLocation("");
    setInterviewNotes("");
    setErrors({});
  };

  return (
    <ModalPortal open={open && !!card} onClose={resetAndClose}>
      <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <CalendarClock className="h-5 w-5 text-brand-500" />
            Schedule Interview
          </h2>
          {card && (
            <p className="mt-1 text-sm text-muted">
              Moving <span className="font-semibold text-heading">{card.name}</span> to Interview Scheduled
            </p>
          )}
        </div>
        <button type="button" onClick={resetAndClose} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div>
          <Label>Interview type</Label>
          <Select value={interviewKind} onValueChange={(v) => setInterviewKind(v as StaffInterviewKind)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="phone">Phone screen</SelectItem>
              <SelectItem value="in_person">In-person</SelectItem>
              <SelectItem value="demo">Demo lesson</SelectItem>
              <SelectItem value="panel">Panel interview</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="interviewDate">Date</Label>
            <Input id="interviewDate" type="date" className="mt-1" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
            {errors.interviewDate && <p className="mt-1 text-xs text-danger">{errors.interviewDate}</p>}
          </div>
          <div>
            <Label htmlFor="interviewTime">Time</Label>
            <Input id="interviewTime" type="time" className="mt-1" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} />
            {errors.interviewTime && <p className="mt-1 text-xs text-danger">{errors.interviewTime}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="interviewLocation">Location / Room</Label>
          <Input
            id="interviewLocation"
            className="mt-1"
            placeholder="e.g. HR room · North Nazimabad"
            value={interviewLocation}
            onChange={(e) => setInterviewLocation(e.target.value)}
          />
          {errors.interviewLocation && <p className="mt-1 text-xs text-danger">{errors.interviewLocation}</p>}
        </div>
        <div>
          <Label htmlFor="interviewNotes">Notes (optional)</Label>
          <Textarea
            id="interviewNotes"
            className="mt-1"
            rows={3}
            placeholder="Bring certificates, prepare 10-min demo…"
            value={interviewNotes}
            onChange={(e) => setInterviewNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
        <Button type="button" variant="outline" onClick={resetAndClose}>Cancel</Button>
        <Button type="button" onClick={submit}>Save &amp; Schedule</Button>
      </div>
    </ModalPortal>
  );
}
