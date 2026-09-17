"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { getBranchProtocol } from "@/lib/mock-service";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { formatDate } from "@/lib/utils";
import type { BranchProtocol } from "@/types";

export function StandardBranchProtocolCard() {
  const branchId = useBranchFilter();
  const [protocol, setProtocol] = useState<BranchProtocol | undefined>(undefined);

  useEffect(() => {
    void getBranchProtocol(branchId).then(setProtocol);
  }, [branchId]);

  return (
    <div className="rounded-xl border border-border bg-bg p-4">
      <div className="mb-2 flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4 text-brand-500" />
        <h3 className="text-sm font-semibold text-heading">{protocol?.title ?? "Standard Branch Protocol"}</h3>
      </div>
      {protocol ? (
        <>
          <ol className="space-y-1.5 text-xs text-muted">
            {protocol.steps.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-semibold text-brand-600">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[10px] text-muted">Updated {formatDate(protocol.updatedAt)}</p>
        </>
      ) : (
        <p className="text-xs text-muted">No protocol on record.</p>
      )}
    </div>
  );
}
