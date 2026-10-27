"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Globe, KeyRound, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ModalPortal } from "@/components/ui/modal-portal";
import { ShareableInquiryLink } from "@/components/marketing/ShareableInquiryLink";
import { useCan } from "@/components/security/Can";
import { useApiClient } from "@/lib/api";
import { apiErrorMessage } from "@/lib/admissions-api";
import { useTenantStore } from "@/lib/tenant-store";

/** `WidgetKeyResponse` */
type ApiWidget = { publicKey?: string | null; widgetEnabled?: boolean | null; allowedOrigins?: string[] | null };

/** "https://www.school.com/" → "https://www.school.com"; null when it is not a bare http(s) origin. */
function toOrigin(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if ((url.pathname !== "/" && url.pathname !== "") || url.search || url.hash || url.username) return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Website inquiry widget: `GET` / `PUT /companies/{tenantId}/widget` (enabled +
 * allowed sites) and `POST …/widget/key` to rotate the public key. The public key
 * only identifies the school to the public widget endpoints — it grants no staff access.
 */
export function WidgetSettings() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const canManage = useCan("widget.manage");
  const tenantId = useTenantStore((s) => s.tenantId) ?? "";
  const tenantSlug = useTenantStore((s) => s.tenantSlug) ?? "";
  const path = `/companies/${encodeURIComponent(tenantId)}/widget`;
  const queryKey = ["widget-key", tenantId];

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => api.get<ApiWidget>(path),
    enabled: !!tenantId,
    retry: 0,
  });

  const [enabled, setEnabled] = useState(false);
  const [origins, setOrigins] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState("");
  const [saving, setSaving] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!data) return;
    setEnabled(!!data.widgetEnabled);
    setOrigins(data.allowedOrigins ?? []);
  }, [data]);

  const dirty =
    !!data &&
    (enabled !== !!data.widgetEnabled || JSON.stringify(origins) !== JSON.stringify(data.allowedOrigins ?? []));

  const addOrigin = () => {
    const origin = toOrigin(draft);
    if (!origin) {
      setDraftError("Enter a site address like https://www.yourschool.com (no page path)");
      return;
    }
    if (origins.includes(origin)) {
      setDraftError("Already added");
      return;
    }
    setOrigins((o) => [...o, origin]);
    setDraft("");
    setDraftError("");
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const r = await api.put<ApiWidget>(path, { widgetEnabled: enabled, allowedOrigins: origins });
      queryClient.setQueryData(queryKey, r);
      toast.success(`Widget settings saved${r?.widgetEnabled ? " — the widget is on" : ""}`);
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not save the widget settings."));
    } finally {
      setSaving(false);
    }
  };

  const rotate = async () => {
    if (rotating) return;
    setRotating(true);
    try {
      const r = await api.post<ApiWidget>(`${path}/key`);
      queryClient.setQueryData(queryKey, r);
      toast.success("New public key generated — update it on your website");
      setConfirmRotate(false);
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not generate a new key."));
    } finally {
      setRotating(false);
    }
  };

  const copyKey = async () => {
    if (!data?.publicKey) return;
    await navigator.clipboard.writeText(data.publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-brand-500" />
          Website inquiry widget
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {!tenantId || isPending ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading widget settings…
          </p>
        ) : isError ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-danger">{apiErrorMessage(error, "Could not load the widget settings.")}</span>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted">
              Lets your school website show your branches and programs and send inquiries straight into the admissions
              pipeline. Only the sites listed below can use it.
            </p>

            <div>
              <Label>Public key</Label>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-[#DFE3E8] bg-bg px-3 py-2 font-mono text-xs">
                  {data?.publicKey || "No key yet"}
                </code>
                <Button variant="outline" size="sm" onClick={() => void copyKey()} disabled={!data?.publicKey}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                {canManage && (
                  <Button variant="outline" size="sm" onClick={() => setConfirmRotate(true)}>
                    <KeyRound className="h-4 w-4" />
                    {data?.publicKey ? "Rotate key" : "Generate key"}
                  </Button>
                )}
              </div>
              <p className="mt-1 text-[11px] text-muted">
                Safe to put on your public website — it identifies the school, it is not a password.
              </p>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-[#F1F3F5] px-3 py-2.5 text-sm">
              <Switch checked={enabled} onCheckedChange={setEnabled} disabled={!canManage} />
              <span>
                <span className="font-medium text-heading">Widget enabled</span>
                <span className="block text-xs text-muted">When off, the public widget endpoints refuse requests.</span>
              </span>
            </label>

            <div>
              <Label htmlFor="widgetOrigin">Allowed websites</Label>
              {origins.length === 0 ? (
                <p className="mt-1 text-xs text-muted">No websites yet — add the address your widget runs on.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {origins.map((o) => (
                    <li key={o} className="flex items-center justify-between rounded-lg bg-bg px-3 py-1.5 text-sm">
                      <span className="font-mono text-xs">{o}</span>
                      {canManage && (
                        <button
                          type="button"
                          className="rounded-full p-1 text-muted hover:text-danger"
                          aria-label={`Remove ${o}`}
                          onClick={() => setOrigins((list) => list.filter((x) => x !== o))}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {canManage && (
                <div className="mt-2 flex gap-2">
                  <Input
                    id="widgetOrigin"
                    placeholder="https://www.yourschool.com"
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      setDraftError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addOrigin();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addOrigin} disabled={!draft.trim()}>
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              )}
              {draftError && <p className="mt-1 text-xs text-danger">{draftError}</p>}
            </div>

            {canManage ? (
              <div className="flex items-center gap-3">
                <Button onClick={() => void save()} disabled={!dirty || saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save widget settings
                </Button>
                {dirty && <span className="text-xs text-muted">Unsaved changes</span>}
              </div>
            ) : (
              <p className="text-xs text-muted">View only — changing the widget needs a company admin.</p>
            )}

            {data?.publicKey && data.widgetEnabled && (
              <ShareableInquiryLink tenantSlug={tenantSlug} publicKey={data.publicKey} />
            )}
          </>
        )}
      </CardContent>

      <ModalPortal open={confirmRotate} onClose={rotating ? () => {} : () => setConfirmRotate(false)} closeOnBackdrop={!rotating}>
        <div className="space-y-2 px-6 py-5">
          <h2 className="font-heading text-lg font-bold text-heading">
            {data?.publicKey ? "Rotate the public key?" : "Generate a public key?"}
          </h2>
          {data?.publicKey && (
            <p className="text-sm text-muted">
              Your website and any shared inquiry links using the current key stop loading branches and programs until
              you update them with the new key.
            </p>
          )}
        </div>
        <div className="flex justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
          <Button variant="outline" disabled={rotating} onClick={() => setConfirmRotate(false)}>
            Cancel
          </Button>
          <Button variant={data?.publicKey ? "destructive" : "default"} disabled={rotating} onClick={() => void rotate()}>
            {rotating && <Loader2 className="h-4 w-4 animate-spin" />}
            {data?.publicKey ? "Rotate key" : "Generate key"}
          </Button>
        </div>
      </ModalPortal>
    </Card>
  );
}
