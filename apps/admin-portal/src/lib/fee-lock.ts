import type { FeeLockRequestStatus } from "@/types";

export const FEE_LOCK_STATUS_LABEL: Record<FeeLockRequestStatus, string> = {
  pending_ho: "Pending HO",
  approved: "Approved",
  rejected: "Rejected",
};

export const FEE_LOCK_STATUS_BADGE: Record<
  FeeLockRequestStatus,
  "warning" | "success" | "danger" | "secondary"
> = {
  pending_ho: "warning",
  approved: "success",
  rejected: "danger",
};
