"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle2, Loader2, Minus, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useBranches, branchLabel } from "@/lib/hooks/use-branches";
import { CAPABILITIES, ROLE_LABELS, Roles, type Capability } from "@/lib/rbac";
import { useTenantStore } from "@/lib/tenant-store";
import { formatDate } from "@/lib/utils";

/** `RoleApprovalSubmitRequest.requestedRole` */
const REQUESTABLE_ROLES = [
  "COMPANY_ADMIN",
  "BRANCH_ADMIN",
  "FINANCE_ADMIN",
  "INVENTORY_MANAGER",
  "TEACHER",
  "TEMP_SUBSTITUTE_TEACHER",
  "READONLY_AUDITOR",
  "PARENT",
] as const;

/** `RoleApprovalSubmitRequest.scope` */
const SCOPES = [
  { value: "COMPANY", label: "Whole company" },
  { value: "BRANCH", label: "One branch" },
  { value: "CLASSROOM", label: "One classroom" },
  { value: "STAFF", label: "Staff member" },
  { value: "PARENT", label: "Parent" },
] as const;

/** `RoleApprovalResponse` */
type ApiRoleApproval = {
  id: number;
  requesterUsername?: string | null;
  targetUsername?: string | null;
  requestedRole?: string | null;
  scope?: string | null;
  scopeId?: string | null;
  justification?: string | null;
  status?: string | null;
  expiresAt?: string | null;
  createdAt?: string | null;
};

/** Roles shown as matrix columns — the ones a school assigns day to day. */
const MATRIX_ROLES = [
  Roles.CompanyAdmin,
  Roles.BranchAdmin,
  Roles.Admin,
  Roles.Staff,
  Roles.Teacher,
  Roles.Accountant,
  Roles.FinanceAdmin,
  Roles.ReadonlyAuditor,
];

/** "fees.branchApprove" → "Fees · branch approve" */
function capabilityLabel(key: string): string {
  const [area, action = ""] = key.split(".");
  const words = action.replace(/([A-Z])/g, " $1").toLowerCase();
  return `${area.charAt(0).toUpperCase()}${area.slice(1)} · ${words}`;
}

const EMPTY_REQUEST = {
  targetUsername: "",
  requestedRole: "BRANCH_ADMIN" as string,
  scope: "BRANCH" as string,
  scopeId: "",
  justification: "",
  expiresAt: "",
};

/**
 * Settings → Users & roles. Shows the signed-in user's access, what each role may do
 * in the ERP (lib/rbac.ts), and the role assignment approval flow:
 * `POST /security/rbac/role-approvals`, `GET …/pending`, `PUT …/{id}/review`.
 */
export function RolesPrivileges() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const tenantId = useTenantStore((s) => s.tenantId) ?? "";
  const myRoles = useTenantStore((s) => s.roles);
  const myPermissions = useTenantStore((s) => s.permissions);
  const canRequest = useCan("security.roleRequest");
  const canReview = useCan("security.roleReview");
  const { branches } = useBranches();

  const [request, setRequest] = useState(EMPTY_REQUEST);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const pendingKey = ["role-approvals", tenantId];
  const pending = useQuery({
    queryKey: pendingKey,
    queryFn: () => api.get<ApiRoleApproval[]>("/security/rbac/role-approvals/pending"),
    enabled: canReview || canRequest,
  });

  const set = (key: keyof typeof EMPTY_REQUEST, value: string) => setRequest((r) => ({ ...r, [key]: value }));

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!/^[A-Za-z0-9._@-]{3,}$/.test(request.targetUsername.trim())) next.targetUsername = "Enter the user's username";
    if (request.scope !== "COMPANY" && !request.scopeId.trim()) next.scopeId = "Choose what the role applies to";
    if (request.justification.trim().length < 10) next.justification = "Explain why (at least 10 characters)";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await api.post("/security/rbac/role-approvals", {
        targetUsername: request.targetUsername.trim(),
        requestedRole: request.requestedRole,
        scope: request.scope,
        scopeId: request.scope === "COMPANY" ? tenantId : request.scopeId.trim(),
        justification: request.justification.trim(),
        expiresAt: request.expiresAt ? new Date(request.expiresAt).toISOString() : undefined,
      });
      toast.success(`Role request sent for ${request.targetUsername.trim()} — waiting for approval`);
      setRequest(EMPTY_REQUEST);
      void queryClient.invalidateQueries({ queryKey: pendingKey });
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not submit the role request."));
    } finally {
      setSaving(false);
    }
  };

  const review = async (item: ApiRoleApproval, status: "APPROVED" | "REJECTED") => {
    setReviewingId(item.id);
    try {
      await api.put(`/security/rbac/role-approvals/${item.id}/review`, { status });
      toast.success(`${item.targetUsername ?? "Request"} — ${status === "APPROVED" ? "approved" : "rejected"}`);
      void queryClient.invalidateQueries({ queryKey: pendingKey });
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not review the request."));
    } finally {
      setReviewingId(null);
    }
  };

  const scopeName = (item: ApiRoleApproval) =>
    item.scope === "BRANCH" ? branchLabel(branches, item.scopeId) : item.scopeId || "—";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-500" />
            Your access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-1.5">
            {myRoles.length ? (
              myRoles.map((r) => (
                <Badge key={r} variant="info">
                  {ROLE_LABELS[r] ?? r}
                </Badge>
              ))
            ) : (
              <span className="text-muted">No roles on this session.</span>
            )}
          </div>
          {myPermissions.length > 0 && (
            <p className="text-xs text-muted">
              Permissions: {myPermissions.map((p) => p.replace(/_/g, " ").toLowerCase()).join(", ")}
            </p>
          )}
          <p className="text-xs text-muted">
            New login accounts are created under HR &amp; Staff → User Accounts.
          </p>
        </CardContent>
      </Card>

      {canRequest && (
        <Card>
          <CardHeader>
            <CardTitle>Request a role for a user</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted">
              Role changes need a second approver. The request appears below until a company admin approves or
              rejects it.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="roleTarget">Username</Label>
                <Input
                  id="roleTarget"
                  className="mt-1"
                  placeholder="fatima.staff"
                  value={request.targetUsername}
                  onChange={(e) => set("targetUsername", e.target.value)}
                />
                {errors.targetUsername && <p className="mt-1 text-xs text-danger">{errors.targetUsername}</p>}
              </div>
              <div>
                <Label>Role</Label>
                <Select value={request.requestedRole} onValueChange={(v) => set("requestedRole", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUESTABLE_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r] ?? r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Applies to</Label>
                <Select
                  value={request.scope}
                  onValueChange={(v) => setRequest((r) => ({ ...r, scope: v, scopeId: "" }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCOPES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {request.scope === "BRANCH" ? (
                <div>
                  <Label>Branch</Label>
                  <Select value={request.scopeId} onValueChange={(v) => set("scopeId", v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.code} value={b.code}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.scopeId && <p className="mt-1 text-xs text-danger">{errors.scopeId}</p>}
                </div>
              ) : request.scope !== "COMPANY" ? (
                <div>
                  <Label htmlFor="roleScopeId">
                    {request.scope === "CLASSROOM" ? "Classroom id" : request.scope === "STAFF" ? "Staff id" : "Parent id"}
                  </Label>
                  <Input
                    id="roleScopeId"
                    className="mt-1"
                    value={request.scopeId}
                    onChange={(e) => set("scopeId", e.target.value)}
                  />
                  {errors.scopeId && <p className="mt-1 text-xs text-danger">{errors.scopeId}</p>}
                </div>
              ) : (
                <div />
              )}
              <div>
                <Label htmlFor="roleExpires">Expires (optional)</Label>
                <Input
                  id="roleExpires"
                  type="date"
                  className="mt-1"
                  value={request.expiresAt}
                  onChange={(e) => set("expiresAt", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="roleJustification">Justification</Label>
              <Textarea
                id="roleJustification"
                className="mt-1"
                rows={2}
                maxLength={500}
                placeholder="e.g. Covering the branch head while she is on leave"
                value={request.justification}
                onChange={(e) => set("justification", e.target.value)}
              />
              {errors.justification && <p className="mt-1 text-xs text-danger">{errors.justification}</p>}
            </div>
            <Button onClick={() => void submit()} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit for approval
            </Button>
          </CardContent>
        </Card>
      )}

      {(canReview || canRequest) && (
        <Card>
          <CardHeader>
            <CardTitle>Pending role requests</CardTitle>
          </CardHeader>
          <CardContent>
            {pending.isPending ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading requests…
              </div>
            ) : pending.isError ? (
              <p className="text-sm text-danger">{apiErrorMessage(pending.error, "Could not load the requests.")}</p>
            ) : (pending.data ?? []).length === 0 ? (
              <p className="text-sm text-muted">No role requests are waiting.</p>
            ) : (
              <div className="space-y-2">
                {(pending.data ?? []).map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[#F1F3F5] px-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-heading">
                        {item.targetUsername} → {ROLE_LABELS[item.requestedRole ?? ""] ?? item.requestedRole}
                      </p>
                      <p className="text-xs text-muted">
                        {(item.scope ?? "").toLowerCase()} {scopeName(item)} · requested by {item.requesterUsername ?? "—"}
                        {item.createdAt ? ` · ${formatDate(item.createdAt, "dd MMM yyyy")}` : ""}
                        {item.expiresAt ? ` · expires ${formatDate(item.expiresAt, "dd MMM yyyy")}` : ""}
                      </p>
                      {item.justification && <p className="mt-1 text-xs italic text-muted">“{item.justification}”</p>}
                    </div>
                    {canReview && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={reviewingId === item.id}
                          onClick={() => void review(item, "REJECTED")}
                        >
                          <XCircle className="h-4 w-4 text-danger" />
                          Reject
                        </Button>
                        <Button size="sm" disabled={reviewingId === item.id} onClick={() => void review(item, "APPROVED")}>
                          {reviewingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Role privileges</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-muted">
            What each role can open and do in the ERP. The API enforces the same rules; a user can also get a
            single action through a permission (shown under the action).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Action</th>
                  {MATRIX_ROLES.map((r) => (
                    <th key={r} className="px-1 py-2 text-center font-semibold">
                      {ROLE_LABELS[r] ?? r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F5]">
                {(Object.keys(CAPABILITIES) as Capability[]).map((key) => {
                  const rule: { roles: readonly string[]; authority?: string } = CAPABILITIES[key];
                  return (
                    <tr key={key}>
                      <td className="py-1.5 pr-3">
                        <span className="font-medium text-heading">{capabilityLabel(key)}</span>
                        {rule.authority && (
                          <span className="block text-[10px] text-muted">or {rule.authority}</span>
                        )}
                      </td>
                      {MATRIX_ROLES.map((r) => (
                        <td key={r} className="px-1 py-1.5 text-center">
                          {rule.roles.includes(r) ? (
                            <Check className="mx-auto h-3.5 w-3.5 text-emerald-600" aria-label="allowed" />
                          ) : (
                            <Minus className="mx-auto h-3.5 w-3.5 text-[#C4CDD5]" aria-label="not allowed" />
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
