"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IdCardPreviewModal } from "@/components/id-cards/IdCardPreviewModal";
import { getIdCardByPerson, issueStaffIdCard, issueStudentIdCard } from "@/lib/id-card-store";
import type { PortalIdCard } from "@/types";
import { toast } from "sonner";

type Props = {
  kind: "student" | "staff";
  personId: string;
  /** Prefer regenerating if missing */
  canIssue?: boolean;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm";
  className?: string;
};

export function ViewIdCardButton({
  kind,
  personId,
  canIssue = true,
  label = "ID Card",
  variant = "outline",
  size = "sm",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [card, setCard] = useState<PortalIdCard | null>(null);
  const [loading, setLoading] = useState(false);

  const openCard = async () => {
    setLoading(true);
    try {
      let next = await getIdCardByPerson(kind, personId);
      if (!next && canIssue) {
        next =
          (kind === "student"
            ? await issueStudentIdCard(personId)
            : await issueStaffIdCard(personId)) ?? undefined;
        if (next) toast.success("ID card generated");
      }
      if (!next) {
        toast.error(
          kind === "student"
            ? "No ID card yet — complete enrollment first"
            : "No ID card yet — mark candidate as hired first"
        );
        return;
      }
      setCard(next);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={loading}
        onClick={openCard}
      >
        <CreditCard className="h-3.5 w-3.5" />
        {loading ? "Loading…" : label}
      </Button>
      <IdCardPreviewModal open={open} card={card} onClose={() => setOpen(false)} />
    </>
  );
}
