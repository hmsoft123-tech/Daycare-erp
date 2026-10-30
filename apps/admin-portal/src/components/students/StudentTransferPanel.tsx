"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { branchLabel, useBranches } from "@/lib/hooks/use-branches";
import type { ApiClassroom, ApiTransfer } from "@/lib/students-api";

type Kind = "branch" | "classroom";
const NO_CLASSROOM = "__none";

type Props = {
  studentId: string;
  studentName: string;
  branchCode: string;
  currentClassroomId?: string;
  currentClassroomName?: string;
};

/** Classrooms of a branch (`GET /hierarchy/branches/{numeric id}/classrooms`). */
function useClassrooms(branchNumericId: string | undefined) {
  const api = useApiClient();
  return useQuery({
    queryKey: ["classrooms", branchNumericId],
    queryFn: () => api.get<ApiClassroom[]>(`/hierarchy/branches/${encodeURIComponent(branchNumericId ?? "")}/classrooms`),
    enabled: !!branchNumericId && /^\d+$/.test(branchNumericId),
    staleTime: 60_000,
  });
}

/**
 * Moves an enrolled student: `POST /admissions/transfers/branch`
 * (target branch + optional classroom) or `/transfers/classroom` (same branch).
 * The API takes no effective date — transfers apply when processed.
 */
export function StudentTransferPanel({
  studentId,
  studentName,
  branchCode,
  currentClassroomId,
  currentClassroomName,
}: Props) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const canTransfer = useCan("admissions.transfer");
  const { branches } = useBranches();

  const [kind, setKind] = useState<Kind>("classroom");
  const [targetBranch, setTargetBranch] = useState("");
  const [classroom, setClassroom] = useState(NO_CLASSROOM);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ApiTransfer | null>(null);

  const current = branches.find((b) => b.code === branchCode || b.id === branchCode);
  const target = kind === "branch" ? branches.find((b) => b.code === targetBranch) : current;
  const classroomsQuery = useClassrooms(target?.id);
  const classrooms = (classroomsQuery.data ?? []).filter(
    (c) => c.active !== false && String(c.id) !== currentClassroomId
  );
  const pickedRoom = classrooms.find((c) => String(c.id) === classroom);

  const review = () => {
    const next: Record<string, string> = {};
    if (kind === "branch" && !targetBranch) next.target = "Choose the branch";
    if (kind === "branch" && targetBranch && targetBranch === current?.code) next.target = "Already in this branch";
    if (kind === "classroom" && classroom === NO_CLASSROOM) next.classroom = "Choose the classroom";
    if (reason.trim().length < 5) next.reason = "Give a reason (at least 5 characters)";
    setErrors(next);
    if (!Object.keys(next).length) setConfirming(true);
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    const entityId = Number(studentId);
    const room = classroom === NO_CLASSROOM ? undefined : classroom;
    try {
      const r =
        kind === "branch"
          ? await api.post<ApiTransfer>("/admissions/transfers/branch", {
              entityId,
              targetBranchId: targetBranch,
              targetClassroomId: room,
              transferReason: reason.trim(),
            })
          : await api.post<ApiTransfer>("/admissions/transfers/classroom", {
              entityId,
              targetClassroomId: room,
              transferReason: reason.trim(),
            });
      setResult(r);
      toast.success(r?.message || "Transfer submitted");
      setConfirming(false);
      setReason("");
      setClassroom(NO_CLASSROOM);
      void queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      void queryClient.invalidateQueries({ queryKey: ["students"] });
      void queryClient.invalidateQueries({ queryKey: ["classrooms"] });
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not transfer the student."));
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  if (!canTransfer) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted">Transfers need a branch or company admin.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-heading">
            <ArrowRightLeft className="h-4 w-4 text-brand-500" />
            Transfer
          </h3>
          <p className="text-xs text-muted">
            Currently at {branchLabel(branches, branchCode)}
            {currentClassroomId ? `, classroom ${currentClassroomName ?? currentClassroomId}` : ""}. Transfers take effect when processed — the API has no
            future effective date.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-bg p-1" role="radiogroup" aria-label="Transfer type">
          {(["classroom", "branch"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => {
                setKind(k);
                setClassroom(NO_CLASSROOM);
                setErrors({});
              }}
              className={
                kind === k
                  ? "rounded-lg bg-surface px-3.5 py-2 text-sm font-semibold text-heading shadow-card"
                  : "rounded-lg px-3.5 py-2 text-sm font-semibold text-muted"
              }
            >
              {k === "classroom" ? "Another classroom" : "Another branch"}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {kind === "branch" && (
            <div>
              <Label>Target branch</Label>
              <Select
                value={targetBranch}
                onValueChange={(v) => {
                  setTargetBranch(v);
                  setClassroom(NO_CLASSROOM);
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches
                    .filter((b) => b.code !== current?.code)
                    .map((b) => (
                      <SelectItem key={b.code} value={b.code}>
                        {b.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.target && <p className="mt-1 text-xs text-danger">{errors.target}</p>}
            </div>
          )}
          <div>
            <Label>{kind === "branch" ? "Classroom (optional)" : "Target classroom"}</Label>
            <Select value={classroom} onValueChange={setClassroom} disabled={!target || classroomsQuery.isPending}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CLASSROOM}>
                  {!target ? "Pick a branch first" : classroomsQuery.isPending ? "Loading classrooms…" : "Not chosen"}
                </SelectItem>
                {classrooms.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)} disabled={c.hasVacancy === false}>
                    {c.name || c.code}
                    {c.ageGroupOrGrade ? ` · ${c.ageGroupOrGrade}` : ""}
                    {c.availableSeats != null ? ` · ${c.availableSeats} seats` : ""}
                    {c.hasVacancy === false ? " (full)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {classroomsQuery.isError && (
              <p className="mt-1 text-xs text-danger">{apiErrorMessage(classroomsQuery.error, "Could not load classrooms.")}</p>
            )}
            {!!target && !classroomsQuery.isPending && !classroomsQuery.isError && classrooms.length === 0 && (
              <p className="mt-1 text-xs text-muted">No classrooms set up in this branch.</p>
            )}
            {errors.classroom && <p className="mt-1 text-xs text-danger">{errors.classroom}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="transferReason">Reason</Label>
          <Textarea
            id="transferReason"
            className="mt-1"
            rows={2}
            maxLength={500}
            placeholder={kind === "branch" ? "Family relocating closer to North Campus" : "Promoted to Toddler Advanced room"}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          {errors.reason && <p className="mt-1 text-xs text-danger">{errors.reason}</p>}
        </div>

        <div className="flex justify-end">
          <Button onClick={review}>Review transfer</Button>
        </div>

        {result && (
          <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3 text-sm">
            <p className="font-semibold text-heading">{result.message || "Transfer submitted"}</p>
            <p className="text-xs text-muted">
              {[result.fromLocation, result.toLocation].filter(Boolean).join(" → ")}
              {result.status ? ` · ${result.status.replace(/_/g, " ").toLowerCase()}` : ""}
            </p>
          </div>
        )}
      </CardContent>

      <ModalPortal open={confirming} onClose={busy ? () => {} : () => setConfirming(false)} closeOnBackdrop={!busy}>
        <div className="space-y-2 px-6 py-5">
          <h2 className="font-heading text-lg font-bold text-heading">Transfer {studentName}?</h2>
          <p className="text-sm text-muted">
            {kind === "branch"
              ? `From ${branchLabel(branches, branchCode)} to ${target?.name ?? targetBranch}`
              : `To classroom ${pickedRoom?.name ?? classroom} in ${branchLabel(branches, branchCode)}`}
            {kind === "branch" && pickedRoom ? `, classroom ${pickedRoom.name}` : ""}.
          </p>
          <p className="text-sm text-muted">Reason: {reason.trim()}</p>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
          <Button variant="outline" disabled={busy} onClick={() => setConfirming(false)}>
            Back
          </Button>
          <Button disabled={busy} onClick={() => void submit()}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Transfer
          </Button>
        </div>
      </ModalPortal>
    </Card>
  );
}
