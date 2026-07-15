"use client";

import { useMemo, useState } from "react";
import {
  Download,
  MoreHorizontal,
  Search,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BulkImportParentsModal } from "@/components/parents/BulkImportParentsModal";
import { AddParentModal } from "@/components/parents/AddParentModal";
import { parentAccounts, type ParentAccount, type ParentAccountStatus } from "@/data/parents";
import { branches } from "@/data/branches";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { formatDate, getInitials, cn } from "@/lib/utils";
import { toast } from "sonner";

const statusVariant: Record<ParentAccountStatus, "success" | "warning" | "secondary"> = {
  active: "success",
  pending: "warning",
  inactive: "secondary",
};

const PAGE_SIZE = 10;

export function ParentsDirectory() {
  const branchFilter = useBranchFilter();
  const [rows, setRows] = useState<ParentAccount[]>(parentAccounts);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [branchId, setBranchId] = useState<string>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const effectiveBranch = branchFilter ?? (branchId === "all" ? undefined : branchId);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((p) => {
      if (effectiveBranch && p.branchId !== effectiveBranch) return false;
      if (status !== "all" && p.status !== status) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.childrenNames.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [rows, search, status, effectiveBranch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const allPageSelected =
    pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id));

  const toggleAllPage = () => {
    if (allPageSelected) {
      setSelected((prev) => prev.filter((id) => !pageRows.some((r) => r.id === id)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...pageRows.map((r) => r.id)])]);
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const exportCsv = () => {
    const header = "name,email,phone,status,branch,children,lastLogin\n";
    const body = filtered
      .map((p) => {
        const branch = branches.find((b) => b.id === p.branchId)?.name ?? p.branchId;
        return `"${p.name}","${p.email}","${p.phone}","${p.status}","${branch}","${p.childrenNames.join("; ")}","${p.lastLogin ?? ""}"`;
      })
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "parents-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} parents`);
  };

  const onImported = (count: number) => {
    // Mock: prepend placeholder rows so UI feels updated
    const now = new Date().toISOString().slice(0, 10);
    const extras: ParentAccount[] = Array.from({ length: Math.min(count, 5) }).map((_, i) => ({
      id: `par-imp-${Date.now()}-${i}`,
      name: `Imported Parent ${i + 1}`,
      email: `imported${i + 1}@email.com`,
      phone: "+92 300 0000000",
      status: "pending" as const,
      branchId: effectiveBranch ?? "branch-nn",
      childrenNames: [],
      portalAccess: true,
      createdAt: now,
    }));
    setRows((prev) => [...extras, ...prev]);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
            <Users className="h-3.5 w-3.5" /> Family Management
          </p>
          <h1 className="font-heading text-[1.5rem] font-bold tracking-tight text-heading md:text-[1.75rem]">
            Parent User Management
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage parent accounts, portal access, and approval status.
          </p>
        </div>
        <div className="rounded-full bg-brand-50 px-3.5 py-1.5 text-xs font-bold text-brand-700">
          {filtered.length} Accounts Found
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-card lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, phone, or child…"
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full lg:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {!branchFilter && (
          <Select
            value={branchId}
            onValueChange={(v) => {
              setBranchId(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full lg:w-[200px]">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button type="button" variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={selected.length === 0}
            onClick={() => toast.message(`${selected.length} selected — bulk actions coming soon`)}
          >
            Bulk Actions
          </Button>
        </div>
      </div>

      {/* Directory card */}
      <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
        <div className="flex flex-col gap-3 border-b border-[#F1F3F5] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-heading">
            Parent Directory
            <span className="ml-2 font-normal text-muted">
              Showing {pageRows.length} of {filtered.length} accounts
            </span>
          </p>
          <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Add Parent
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-[#F9FAFB] text-xs font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="w-12 px-4 py-3.5 text-left">
                  <Checkbox checked={allPageSelected} onCheckedChange={toggleAllPage} />
                </th>
                <th className="px-4 py-3.5 text-left">Parent</th>
                <th className="px-4 py-3.5 text-left">Children</th>
                <th className="px-4 py-3.5 text-left">Branch</th>
                <th className="px-4 py-3.5 text-left">Status</th>
                <th className="px-4 py-3.5 text-left">Portal</th>
                <th className="px-4 py-3.5 text-left">Last Login</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => {
                const branch = branches.find((b) => b.id === row.branchId);
                return (
                  <tr key={row.id} className="border-t border-[#F1F3F5] hover:bg-[#F9FAFB]">
                    <td className="px-4 py-3.5">
                      <Checkbox
                        checked={selected.includes(row.id)}
                        onCheckedChange={() => toggleOne(row.id)}
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-brand-50 text-xs font-semibold text-brand-700">
                            {getInitials(row.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-heading">{row.name}</p>
                          <p className="truncate text-xs text-muted">{row.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted">
                      {row.childrenNames.length > 0 ? row.childrenNames.join(", ") : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-muted">{branch?.name.replace(" Campus", "") ?? "—"}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={statusVariant[row.status]} className="capitalize">
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          row.portalAccess ? "text-brand-600" : "text-muted"
                        )}
                      >
                        {row.portalAccess ? "Enabled" : "Off"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-muted">
                      {row.lastLogin ? formatDate(row.lastLogin) : "Never"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        className="rounded-lg p-2 text-muted hover:bg-bg hover:text-heading"
                        aria-label="Row actions"
                        onClick={() => toast.message(`Actions for ${row.name}`)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted">
                    No parents match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#F1F3F5] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            Page {pageSafe} of {totalPages}
            {selected.length > 0 ? ` · ${selected.length} selected` : ""}
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pageSafe <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const n = i + 1;
              return (
                <Button
                  key={n}
                  type="button"
                  size="sm"
                  variant={n === pageSafe ? "default" : "outline"}
                  onClick={() => setPage(n)}
                  className="min-w-9"
                >
                  {n}
                </Button>
              );
            })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pageSafe >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <BulkImportParentsModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={onImported}
      />
      <AddParentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        defaultBranchId={effectiveBranch}
        onSave={(parent) => {
          setRows((prev) => [parent, ...prev]);
          setPage(1);
        }}
      />
    </div>
  );
}
