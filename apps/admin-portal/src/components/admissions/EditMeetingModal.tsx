"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Loader2, X } from "lucide-react";
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
import {
  MEETING_STATUSES,
  type ApiInquiryMeeting,
  type ApiMeetingType,
  type MeetingUpdate,
} from "@/lib/admissions-api";

type Props = {
  meeting: ApiInquiryMeeting | null;
  saving?: boolean;
  onCancel: () => void;
  onSave: (update: MeetingUpdate) => void;
};

/** Edits a scheduled tour / interview / assessment (`PUT /admissions/inquiries/{id}/meetings/{meetingId}`). */
export function EditMeetingModal({ meeting, saving = false, onCancel, onSave }: Props) {
  const [meetingType, setMeetingType] = useState<ApiMeetingType>("CAMPUS_TOUR");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("SCHEDULED");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!meeting) return;
    setMeetingType((meeting.meetingType as ApiMeetingType) || "CAMPUS_TOUR");
    setDate(meeting.scheduledDate ?? "");
    setTime(meeting.scheduledTime?.slice(0, 5) ?? "");
    setLocation(meeting.locationOrClassroom ?? "");
    setStatus(meeting.status || "SCHEDULED");
    setNotes(meeting.notes ?? "");
    setError(null);
  }, [meeting]);

  const submit = () => {
    if (!date || !time) return setError("Enter the meeting date and time.");
    setError(null);
    onSave({
      meetingType,
      scheduledDate: date,
      scheduledTime: time.length === 5 ? `${time}:00` : time,
      locationOrClassroom: location.trim() || undefined,
      status,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <ModalPortal open={!!meeting} onClose={saving ? () => {} : onCancel} closeOnBackdrop={!saving}>
      <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
          <CalendarClock className="h-5 w-5 text-brand-500" />
          Edit meeting
        </h2>
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

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Meeting type</Label>
            <Select value={meetingType} onValueChange={(v) => setMeetingType(v as ApiMeetingType)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CAMPUS_TOUR">Campus tour</SelectItem>
                <SelectItem value="PARENT_INTERVIEW">Parent interview</SelectItem>
                <SelectItem value="ASSESSMENT">Assessment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEETING_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="meetingDate">Date</Label>
            <Input
              id="meetingDate"
              type="date"
              className="mt-1"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="meetingTime">Time</Label>
            <Input
              id="meetingTime"
              type="time"
              className="mt-1"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="meetingLocation">Location / classroom</Label>
          <Input
            id="meetingLocation"
            className="mt-1"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="meetingNotes">Notes</Label>
          <Textarea
            id="meetingNotes"
            className="mt-1"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
        <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" disabled={saving} onClick={submit}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save meeting
        </Button>
      </div>
    </ModalPortal>
  );
}
