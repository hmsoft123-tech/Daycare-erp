"use client";

import { useUIStore } from "@/lib/store";

export function useBranchFilter(): string | undefined {
  const { contextId, contextType } = useUIStore();
  return contextType === "head_office" ? undefined : contextId;
}
