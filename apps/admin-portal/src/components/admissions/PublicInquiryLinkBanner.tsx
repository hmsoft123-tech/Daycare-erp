"use client";

import { useQuery } from "@tanstack/react-query";
import { ShareableInquiryLink } from "@/components/marketing/ShareableInquiryLink";
import { useHolds } from "@/components/security/Can";
import { useApiClient } from "@/lib/api";
import { useTenantStore } from "@/lib/tenant-store";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

type Props = {
  title?: string;
  description?: string;
  /** Prefill public form inquiry type (e.g. employment) */
  inquiryType?: "admission" | "employment" | "tour" | "general";
};

/** `WidgetKeyResponse` from `GET /companies/{tenantId}/widget` */
type ApiWidgetKey = { publicKey?: string | null; widgetEnabled?: boolean };

export function PublicInquiryLinkBanner({
  title = "Public inquiry link",
  description = "Parents open this link to submit inquiries — no iframe or embed required. Inquiries appear in your CRM pipeline.",
  inquiryType,
}: Props) {
  const api = useApiClient();
  const tenantSlug = useTenantStore((s) => s.tenantSlug) ?? "kinder-pilot";
  const tenantId = useTenantStore((s) => s.tenantId);
  // Reading the widget settings is limited to company admins.
  const canReadWidget = useHolds("widget.manage");

  // The widget key lets the public form show this school's live branches and programs.
  const { data: widget } = useQuery({
    queryKey: ["widget-key", tenantId],
    queryFn: () => api.get<ApiWidgetKey>(`/companies/${encodeURIComponent(tenantId ?? "")}/widget`),
    enabled: !!tenantId && canReadWidget,
    staleTime: 10 * 60_000,
    retry: 0,
  });
  const publicKey = widget?.widgetEnabled !== false ? widget?.publicKey ?? undefined : undefined;

  return (
    <Card className="mb-6 border-brand-200 bg-gradient-to-r from-brand-50/80 to-surface">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-brand-600" />
          <h3 className="font-heading text-sm font-bold text-heading">{title}</h3>
        </div>
        <p className="mb-4 text-sm text-muted">{description}</p>
        <ShareableInquiryLink tenantSlug={tenantSlug} inquiryType={inquiryType} publicKey={publicKey} />
      </CardContent>
    </Card>
  );
}
