/**
 * Head Office procurement pipeline helpers (SDLC requisition catalogue).
 *
 * Flow: Branch requests (any: inventory / stationery / books / courses…)
 *     → HO enters amounts & generates bill
 *     → Bill paid
 *     → HO dispatches inventory to branch
 *     → Branch / HO confirms receive → stock updated
 */

import type { PRStatus, RequisitionKind } from "@/types";

export const REQUISITION_KINDS: { value: RequisitionKind; label: string }[] = [
  { value: "stationery", label: "Stationery" },
  { value: "groceries", label: "Groceries" },
  { value: "toiletries", label: "Toiletries" },
  { value: "printed", label: "Printed material" },
  { value: "books", label: "Books / library" },
  { value: "courses", label: "Courses / training" },
  { value: "inventory", label: "General inventory" },
  { value: "other", label: "Other" },
];

export const PR_STATUS_LABEL: Record<PRStatus, string> = {
  pending: "Pending HO",
  billed: "Bill generated",
  paid: "Bill paid",
  dispatched: "Dispatched",
  received: "Received",
  rejected: "Rejected",
  approved: "Approved (legacy)",
};

export const PR_STATUS_BADGE: Record<
  PRStatus,
  "warning" | "success" | "danger" | "info" | "default" | "secondary"
> = {
  pending: "warning",
  billed: "info",
  paid: "default",
  dispatched: "secondary",
  received: "success",
  rejected: "danger",
  approved: "success",
};

/** Next HO/branch action after current status */
export function nextProcurementAction(
  status: PRStatus
): { action: PRStatus; label: string; hoOnly: boolean } | null {
  switch (status) {
    case "pending":
    case "approved":
      return { action: "billed", label: "Generate bill", hoOnly: true };
    case "billed":
      return { action: "paid", label: "Mark bill paid", hoOnly: true };
    case "paid":
      return { action: "dispatched", label: "Dispatch to branch", hoOnly: true };
    case "dispatched":
      return { action: "received", label: "Confirm received", hoOnly: false };
    default:
      return null;
  }
}

export function lineAmount(qty: number, unitPrice: number): number {
  return Math.max(0, qty) * Math.max(0, unitPrice);
}

export function requisitionTotal(
  items: { qty: number; unitPrice: number }[]
): number {
  return items.reduce((sum, i) => sum + lineAmount(i.qty, i.unitPrice), 0);
}

export const REQUISITION_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function defaultForMonth(isoDate = new Date().toISOString().slice(0, 10)): string {
  const d = new Date(isoDate + "T12:00:00");
  return `${REQUISITION_MONTHS[d.getMonth()]} (${d.getFullYear()})`;
}
