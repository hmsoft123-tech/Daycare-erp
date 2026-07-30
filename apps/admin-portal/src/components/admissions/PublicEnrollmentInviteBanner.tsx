"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createEnrollmentInvite, buildEnrollmentInviteUrl } from "@/lib/enrollment-invite-store";
import { useTenantStore } from "@/lib/tenant-store";
import { ExternalLink } from "lucide-react";

/** Admin CRM banner — create a demo secure enrollment invite URL */
export function PublicEnrollmentInviteBanner() {
  const tenantSlug = useTenantStore((s) => s.tenantSlug) ?? "kinder-pilot";
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Stable demo token for QA
    setUrl(buildEnrollmentInviteUrl("demo-enroll-2025", tenantSlug));
  }, [tenantSlug]);

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mintFresh = () => {
    const invite = createEnrollmentInvite({
      email: "new.parent@email.com",
      parentName: "New Parent",
      tenantSlug,
      prefill: { branchId: "branch-nn" },
    });
    const next = buildEnrollmentInviteUrl(invite.token, tenantSlug);
    setUrl(next);
    void navigator.clipboard.writeText(next);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="mb-6 border-brand-200 bg-gradient-to-r from-brand-50/80 to-surface">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-brand-600" />
          <h3 className="font-heading text-sm font-bold text-heading">Secure enrollment invite link</h3>
        </div>
        <p className="mb-4 text-sm text-muted">
          Backend will email a unique tokenized URL. Parents open it on a public page (no admin login) to
          complete the same enrollment form. Token is validated for expiry and one-time use.
        </p>
        <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-brand-100 p-2 text-brand-600">
              <Link2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-heading">Demo / QA link</p>
              <p className="mt-0.5 text-xs text-muted">
                Token <code className="rounded bg-white px-1">demo-enroll-2025</code> — or mint a fresh invite.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-3 py-2 text-xs text-brand-800 ring-1 ring-brand-200">
                  {url || "/enroll/…"}
                </code>
                <Button type="button" variant="outline" size="sm" onClick={copy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button type="button" size="sm" onClick={mintFresh}>
                  Mint new invite
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
