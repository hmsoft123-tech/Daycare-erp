"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApiClient } from "@/lib/api";
import { apiErrorMessage } from "@/lib/admissions-api";
import {
  BRANCH_STAFF_ROLES,
  branchStaffPath,
  type ApiBranchStaff,
  type BranchStaffRole,
  type CreateBranchStaff,
} from "@/lib/branch-staff-api";
import { Roles } from "@/lib/rbac";
import { useTenantStore } from "@/lib/tenant-store";
import { branchLabel, useBranches } from "@/lib/hooks/use-branches";
import { formatDate } from "@/lib/utils";

const EMPTY: CreateBranchStaff = {
  username: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  role: "STAFF",
  department: "",
  designation: "",
  active: true,
};

/** Branch user accounts: `GET` / `POST /branches/{branchId}/staff`. */
export function BranchStaffAccounts() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const tenantId = useTenantStore((s) => s.tenantId) ?? "";
  const roles = useTenantStore((s) => s.roles);
  // Branch admins add their own team; creating another branch admin is left to company level.
  const onlyBranchAdmin =
    roles.includes(Roles.BranchAdmin) &&
    !roles.some((r) => [Roles.SuperAdmin, Roles.PlatformAdmin, Roles.CompanyAdmin, Roles.Admin].includes(r as never));
  const roleOptions = onlyBranchAdmin
    ? BRANCH_STAFF_ROLES.filter((r) => r.value !== "BRANCH_ADMIN")
    : BRANCH_STAFF_ROLES;

  // The login lists the user's branches; useBranches falls back to the company's list.
  const { branches } = useBranches();
  const branchIds = branches.map((b) => b.code);
  const branchName = (id: string) => branchLabel(branches, id);

  const [branchId, setBranchId] = useState("");
  useEffect(() => {
    if (!branchId && branchIds.length) setBranchId(branchIds[0]);
  }, [branchId, branchIds]);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateBranchStaff>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const queryKey = ["branch-staff", tenantId, branchId];
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => api.get<ApiBranchStaff[]>(branchStaffPath(branchId)),
    enabled: !!branchId,
  });
  const staff = data ?? [];

  const set = <K extends keyof CreateBranchStaff>(key: K, value: CreateBranchStaff[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const open = () => {
    setForm(EMPTY);
    setErrors({});
    setCreating(true);
  };

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = "Required";
    if (!form.lastName.trim()) next.lastName = "Required";
    if (!/^[A-Za-z0-9._-]{3,}$/.test(form.username.trim())) {
      next.username = "At least 3 characters: letters, numbers, . _ -";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email";
    if (form.password.length < 8) next.password = "At least 8 characters";
    setErrors(next);
    if (Object.keys(next).length || !branchId) return;

    setSaving(true);
    try {
      const created = await api.post<ApiBranchStaff>(branchStaffPath(branchId), {
        ...form,
        username: form.username.trim(),
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone?.trim() || undefined,
        department: form.department?.trim() || undefined,
        designation: form.designation?.trim() || undefined,
      });
      toast.success(`Account created for ${created.fullName || created.username || form.username}`);
      setCreating(false);
      void queryClient.invalidateQueries({ queryKey: ["branch-staff", tenantId] });
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not create the staff account."));
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof CreateBranchStaff, labelText: string, props: { type?: string; placeholder?: string } = {}) => (
    <div>
      <Label htmlFor={`staff-${key}`}>{labelText}</Label>
      <Input
        id={`staff-${key}`}
        className="mt-1"
        type={props.type ?? "text"}
        placeholder={props.placeholder}
        autoComplete={key === "password" ? "new-password" : "off"}
        value={String(form[key] ?? "")}
        onChange={(e) => set(key, e.target.value as never)}
      />
      {errors[key] && <p className="mt-1 text-xs text-danger">{errors[key]}</p>}
    </div>
  );

  return (
    <Card className="mb-6">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-heading">
              <KeyRound className="h-4 w-4 text-brand-500" />
              Branch staff accounts
            </h2>
            <p className="text-xs text-muted">Login accounts for teachers, front desk, accountants and branch admins</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {branchIds.length > 1 && (
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branchIds.map((id) => (
                    <SelectItem key={id} value={id}>
                      {branchName(id) ?? id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button size="sm" onClick={open} disabled={!branchId}>
              <UserPlus className="h-4 w-4" />
              Add staff user
            </Button>
          </div>
        </div>

        {!branchId ? (
          <p className="text-sm text-muted">No branch is available for your account.</p>
        ) : isPending ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading staff accounts…
          </div>
        ) : isError ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-danger">{apiErrorMessage(error, "Could not load staff accounts.")}</span>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : staff.length === 0 ? (
          <p className="text-sm text-muted">No staff accounts in this branch yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Name</th>
                  <th className="py-2 pr-4 font-semibold">Username</th>
                  <th className="py-2 pr-4 font-semibold">Email</th>
                  <th className="py-2 pr-4 font-semibold">Role</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F5]">
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2 pr-4 font-medium text-heading">
                      {s.fullName || [s.firstName, s.lastName].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="py-2 pr-4">{s.username || "—"}</td>
                    <td className="py-2 pr-4">{s.email || "—"}</td>
                    <td className="py-2 pr-4 capitalize">{s.role ? s.role.replace(/_/g, " ").toLowerCase() : "—"}</td>
                    <td className="py-2 pr-4">
                      <Badge variant={s.active === false ? "secondary" : "success"}>
                        {s.active === false ? "Inactive" : "Active"}
                      </Badge>
                    </td>
                    <td className="py-2">{s.createdAt ? formatDate(s.createdAt, "dd MMM yyyy") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <ModalPortal open={creating} onClose={saving ? () => {} : () => setCreating(false)} closeOnBackdrop={!saving}>
        <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
          <div>
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
              <UserPlus className="h-5 w-5 text-brand-500" />
              Add staff user
            </h2>
            <p className="mt-1 text-sm text-muted">Branch {branchName(branchId) ?? branchId}</p>
          </div>
          <button
            type="button"
            onClick={() => setCreating(false)}
            disabled={saving}
            className="rounded-full p-2 text-muted hover:bg-bg"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {field("firstName", "First name")}
            {field("lastName", "Last name")}
            {field("username", "Username", { placeholder: "fatima.staff" })}
            {field("email", "Email", { type: "email" })}
            {field("password", "Temporary password", { type: "password" })}
            {field("phone", "Phone", { placeholder: "+923001234567" })}
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => set("role", v as BranchStaffRole)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {field("department", "Department", { placeholder: "ADMISSIONS" })}
            {field("designation", "Designation", { placeholder: "Admissions Officer" })}
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-heading">
              <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
              Active
            </label>
          </div>
        </div>
        <div className="flex shrink-0 justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
          <Button type="button" variant="outline" disabled={saving} onClick={() => setCreating(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={() => void submit()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </div>
      </ModalPortal>
    </Card>
  );
}
