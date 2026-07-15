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
import type { AdmissionCard, MeetingKind } from "@/types";

export type ScheduleMeetingValues = {
  meetingKind: MeetingKind;
  meetingDate: string;
  meetingTime: string;
  meetingLocation: string;
  meetingNotes: string;
};

type Props = {
  open: boolean;
  card: AdmissionCard | null;
  onCancel: () => void;
  onConfirm: (values: ScheduleMeetingValues) => void;
};

export function ScheduleMeetingModal({ open, card, onCancel, onConfirm }: Props) {
  const [meetingKind, setMeetingKind] = useState<MeetingKind>("tour");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("10:00");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetAndClose = () => {
    setMeetingKind("tour");
    setMeetingDate("");
    setMeetingTime("10:00");
    setMeetingLocation("");
    setMeetingNotes("");
    setErrors({});
    onCancel();
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (!meetingDate) next.meetingDate = "Date required";
    if (!meetingTime) next.meetingTime = "Time required";
    if (!meetingLocation.trim()) next.meetingLocation = "Location required";
    setErrors(next);
    if (Object.keys(next).length) return;
    onConfirm({
      meetingKind,
      meetingDate,
      meetingTime,
      meetingLocation: meetingLocation.trim(),
      meetingNotes: meetingNotes.trim(),
    });
    setMeetingKind("tour");
    setMeetingDate("");
    setMeetingTime("10:00");
    setMeetingLocation("");
    setMeetingNotes("");
    setErrors({});
  };

  return (
    <ModalPortal open={open && !!card} onClose={resetAndClose}>
      <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <CalendarClock className="h-5 w-5 text-brand-500" />
            Schedule Tour / Meeting
          </h2>
          {card && (
            <p className="mt-1 text-sm text-muted">
              Moving <span className="font-semibold text-heading">{card.studentName}</span> to Tour Scheduled
            </p>
          )}
        </div>
        <button type="button" onClick={resetAndClose} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div>
          <Label>Meeting type</Label>
          <Select value={meetingKind} onValueChange={(v) => setMeetingKind(v as MeetingKind)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tour">Campus Tour</SelectItem>
              <SelectItem value="test">Readiness / Test</SelectItem>
              <SelectItem value="assessment">Assessment</SelectItem>
              <SelectItem value="interview">Parent Interview</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="meetingDate">Date</Label>
            <Input
              id="meetingDate"
              type="date"
              className="mt-1"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
            />
            {errors.meetingDate && <p className="mt-1 text-xs text-danger">{errors.meetingDate}</p>}
          </div>
          <div>
            <Label htmlFor="meetingTime">Time</Label>
            <Input
              id="meetingTime"
              type="time"
              className="mt-1"
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
            />
            {errors.meetingTime && <p className="mt-1 text-xs text-danger">{errors.meetingTime}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="meetingLocation">Location / Classroom</Label>
          <Input
            id="meetingLocation"
            className="mt-1"
            placeholder="e.g. North Nazimabad – Front Office"
            value={meetingLocation}
            onChange={(e) => setMeetingLocation(e.target.value)}
          />
          {errors.meetingLocation && (
            <p className="mt-1 text-xs text-danger">{errors.meetingLocation}</p>
          )}
        </div>
        <div>
          <Label htmlFor="meetingNotes">Notes (optional)</Label>
          <Textarea
            id="meetingNotes"
            className="mt-1"
            rows={3}
            placeholder="Bring immunization card, both parents attending…"
            value={meetingNotes}
            onChange={(e) => setMeetingNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
        <Button type="button" variant="outline" onClick={resetAndClose}>
          Cancel
        </Button>
        <Button type="button" onClick={submit}>
          Save &amp; Schedule
        </Button>
      </div>
    </ModalPortal>
  );
}
