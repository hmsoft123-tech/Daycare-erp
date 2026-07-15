"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareableInquiryLinkProps {
  tenantSlug?: string;
  inquiryType?: "admission" | "employment" | "tour" | "general";
}

export function ShareableInquiryLink({ tenantSlug, inquiryType }: ShareableInquiryLinkProps) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (tenantSlug) qs.set("tenant", tenantSlug);
    if (inquiryType) qs.set("type", inquiryType);
    const params = qs.toString() ? `?${qs.toString()}` : "";
    setUrl(`${window.location.origin}/inquiry${params}`);
  }, [tenantSlug, inquiryType]);

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-brand-100 p-2 text-brand-600">
          <Link2 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-heading">Your shareable link</p>
          <p className="mt-0.5 text-xs text-muted">
            Add this URL to your website &quot;Book a Tour&quot; or &quot;Inquire&quot; buttons — no iframe needed.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-white px-3 py-2 text-xs text-brand-800 ring-1 ring-brand-200">
              {url || "/inquiry"}
            </code>
            <Button type="button" variant="outline" size="sm" onClick={copy} className="shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
