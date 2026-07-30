"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Link2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalPortal } from "@/components/ui/modal-portal";
import { buildEnrollmentInviteUrl, type EnrollmentInvite } from "@/lib/enrollment-invite-store";

type Props = {
  open: boolean;
  invite: EnrollmentInvite | null;
  onClose: () => void;
};

/** Shown after admin sends invite_to_pay — copy secure public enrollment URL */
export function EnrollmentInviteLinkModal({ open, invite, onClose }: Props) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!invite) return;
    setUrl(buildEnrollmentInviteUrl(invite.token, invite.tenantSlug));
  }, [invite]);

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ModalPortal open={open && !!invite} onClose={onClose} maxWidth="max-w-lg">
      <div className="border-b border-[#F1F3F5] px-6 py-5">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
          <Mail className="h-5 w-5 text-brand-500" />
          Enrollment invite link
        </h2>
        <p className="mt-1 text-sm text-muted">
          In production the backend emails this secure link. For now, copy and share it with the parent.
        </p>
      </div>
      <div className="space-y-4 px-6 py-5">
        {invite && (
          <>
            <p className="text-sm text-heading">
              To: <span className="font-semibold">{invite.parentName}</span>{" "}
              <span className="text-muted">({invite.email})</span>
            </p>
            {invite.securityHint && (
              <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">{invite.securityHint}</p>
            )}
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-bg px-3 py-2 text-xs text-heading ring-1 ring-[#DFE3E8]">
                {url || "…"}
              </code>
              <Button type="button" variant="outline" size="sm" onClick={copy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="flex items-start gap-2 text-xs text-muted">
              <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Public page at <span className="font-mono">/enroll/[token]</span> — validated by token,
              expiry, and one-time completion (company-specific rules later via API).
            </p>
          </>
        )}
      </div>
      <div className="flex justify-end border-t border-[#F1F3F5] px-6 py-4">
        <Button type="button" onClick={onClose}>Done</Button>
      </div>
    </ModalPortal>
  );
}
