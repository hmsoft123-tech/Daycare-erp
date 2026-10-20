"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalPortal } from "@/components/ui/modal-portal";

export type StageNotice = { title: string; message: string };

/** Explains why a card cannot be dropped on a stage (e.g. fees not yet approved). */
export function StageNoticeModal({
  notice,
  onClose,
}: {
  notice: StageNotice | null;
  onClose: () => void;
}) {
  return (
    <ModalPortal open={!!notice} onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-3 px-6 py-6">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          {notice?.title}
        </h2>
        <p className="text-sm text-muted">{notice?.message}</p>
      </div>
      <div className="flex justify-end border-t border-[#F1F3F5] px-6 py-4">
        <Button type="button" onClick={onClose}>
          OK
        </Button>
      </div>
    </ModalPortal>
  );
}
