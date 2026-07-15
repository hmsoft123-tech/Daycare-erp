"use client";

import { useCallback, useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ModalPortal } from "@/components/ui/modal-portal";
import { PARENT_CSV_TEMPLATE } from "@/data/parents";
import { branches } from "@/data/branches";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type BulkImportParentsModalProps = {
  open: boolean;
  onClose: () => void;
  onImported?: (count: number) => void;
};

const ACCESS_OPTIONS = [
  { id: "portal", label: "Grant parent portal access" },
  { id: "emergency", label: "Enable emergency notifications" },
  { id: "billing", label: "Enable fee reminders & billing alerts" },
  { id: "messages", label: "Allow messaging with teachers" },
] as const;

export function BulkImportParentsModal({
  open,
  onClose,
  onImported,
}: BulkImportParentsModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [access, setAccess] = useState<string[]>(["portal", "emergency", "billing"]);
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    setFile(null);
    setDone(false);
    setUploading(false);
    setAccess(["portal", "emergency", "billing"]);
    setBranchIds([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const downloadTemplate = () => {
    const blob = new Blob([PARENT_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kinder-pilot-parents-template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const onFile = (f: File | null) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }
    setFile(f);
    setDone(false);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    onFile(f ?? null);
  }, []);

  const toggleAccess = (id: string) => {
    setAccess((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleBranch = (id: string) => {
    setBranchIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Select a CSV file first");
      return;
    }
    setUploading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const text = await file.text();
    const rows = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const count = Math.max(0, rows.length - 1);
    setUploading(false);
    setDone(true);
    toast.success(`Imported ${count} parent${count === 1 ? "" : "s"} successfully`);
    onImported?.(count);
  };

  return (
    <ModalPortal open={open} onClose={handleClose} maxWidth="max-w-2xl">
      <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
        <div>
          <h2 id="bulk-import-title" className="font-heading text-lg font-bold text-heading">
            Bulk Import Parents
          </h2>
          <p className="mt-1 text-sm text-muted">
            Upload a CSV file to import multiple parent accounts at once.
          </p>
        </div>
        <button
          onClick={handleClose}
          className="rounded-full p-2 text-muted hover:bg-bg"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="flex items-center gap-4 rounded-2xl border border-[#F1F3F5] bg-bg/60 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-heading">Sample CSV Template</p>
                  <p className="text-xs text-muted">
                    Download the template to see required columns (name, email, phone, branch, child).
                  </p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={downloadTemplate}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition",
                  dragOver
                    ? "border-brand-500 bg-brand-50"
                    : "border-[#DFE3E8] bg-bg/40 hover:border-brand-300 hover:bg-brand-50/40"
                )}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                />
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface text-brand-500 shadow-card">
                  <Upload className="h-5 w-5" />
                </div>
                {file ? (
                  <>
                    <p className="text-sm font-semibold text-heading">{file.name}</p>
                    <p className="mt-1 text-xs text-muted">
                      {(file.size / 1024).toFixed(1)} KB · Click to replace
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-heading">Click to upload CSV file</p>
                    <p className="mt-1 text-xs text-muted">Supported format: .csv</p>
                  </>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-[#F1F3F5] p-4">
                  <p className="mb-3 text-sm font-semibold text-heading">Access & notifications</p>
                  <p className="mb-3 text-xs text-muted">Apply to all imported parents</p>
                  <ul className="space-y-2.5">
                    {ACCESS_OPTIONS.map((opt) => (
                      <li key={opt.id} className="flex items-start gap-2.5">
                        <Checkbox
                          id={`acc-${opt.id}`}
                          checked={access.includes(opt.id)}
                          onCheckedChange={() => toggleAccess(opt.id)}
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor={`acc-${opt.id}`}
                          className="cursor-pointer text-sm font-normal text-heading"
                        >
                          {opt.label}
                        </Label>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-[#F1F3F5] p-4">
                  <p className="mb-3 text-sm font-semibold text-heading">Default branch (optional)</p>
                  <p className="mb-3 text-xs text-muted">Override CSV branch when row is blank</p>
                  <ul className="space-y-2.5">
                    {branches.map((b) => (
                      <li key={b.id} className="flex items-start gap-2.5">
                        <Checkbox
                          id={`br-${b.id}`}
                          checked={branchIds.includes(b.id)}
                          onCheckedChange={() => toggleBranch(b.id)}
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor={`br-${b.id}`}
                          className="cursor-pointer text-sm font-normal text-heading"
                        >
                          {b.name}
                        </Label>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {done && (
                <div className="flex items-center gap-2 rounded-2xl bg-soft-green px-4 py-3 text-sm font-semibold text-brand-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Import complete. New parents appear in the directory.
                </div>
              )}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
        <Button type="button" variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button type="button" onClick={handleUpload} disabled={uploading || !file}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </div>
    </ModalPortal>
  );
}
