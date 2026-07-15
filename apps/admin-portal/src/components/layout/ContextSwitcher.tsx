"use client";

import { branches, HEAD_OFFICE_ID } from "@/data/branches";
import { useUIStore } from "@/lib/store";
import { Building2, MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ContextSwitcher() {
  const { contextId, setContext } = useUIStore();

  const handleChange = (value: string) => {
    if (value === HEAD_OFFICE_ID) {
      setContext(HEAD_OFFICE_ID, "head_office");
    } else {
      setContext(value, "branch");
    }
  };

  const currentLabel =
    contextId === HEAD_OFFICE_ID
      ? "Head Office"
      : branches.find((b) => b.id === contextId)?.name ?? "Select Branch";

  return (
    <Select value={contextId} onValueChange={handleChange}>
      <SelectTrigger className="h-10 w-[260px] rounded-xl border-0 bg-white shadow-card">
        <div className="flex items-center gap-2 truncate">
          {contextId === HEAD_OFFICE_ID ? (
            <Building2 className="h-4 w-4 shrink-0 text-brand-500" />
          ) : (
            <MapPin className="h-4 w-4 shrink-0 text-brand-500" />
          )}
          <SelectValue>{currentLabel}</SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent className="rounded-xl border-0 shadow-card">
        <SelectItem value={HEAD_OFFICE_ID}>
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-brand-500" /> Head Office
          </span>
        </SelectItem>
        <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#919EAB]">
          Branches
        </div>
        {branches.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-500" /> {branch.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
