/**
 * Procurement workflow: PR → SQ → PO → Bill → Pay → Dispatch → GRN (receive)
 */

import type { PRStatus, RequisitionKind } from "@/types";

export const REQUISITION_KINDS: { value: RequisitionKind; label: string }[] = [
  { value: "stationery", label: "Stationery" },
  { value: "groceries", label: "Grocery / Pantry" },
  { value: "toiletries", label: "Toiletries & Hygiene" },
  { value: "montessori", label: "Montessori / Learning Materials" },
  { value: "printed", label: "Printed material" },
  { value: "books", label: "Course Books / Library" },
  { value: "courses", label: "Courses / training" },
  { value: "fixed_assets", label: "Fixed Assets" },
  { value: "maintenance", label: "Maintenance & Repair" },
  { value: "it", label: "IT / Technology" },
  { value: "inventory", label: "General inventory" },
  { value: "other", label: "Other operational" },
];

export const PR_STATUS_LABEL: Record<PRStatus, string> = {
  pending: "PR created",
  quotation: "SQ / Quotation",
  po_issued: "PO issued",
  billed: "Invoice recorded",
  paid: "Paid",
  dispatched: "Dispatched",
  received: "GRN / Received",
  rejected: "Rejected",
  approved: "Approved (legacy)",
};

export const PR_STATUS_BADGE: Record<
  PRStatus,
  "warning" | "success" | "danger" | "info" | "default" | "secondary"
> = {
  pending: "warning",
  quotation: "info",
  po_issued: "default",
  billed: "info",
  paid: "secondary",
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
      return { action: "quotation", label: "Record supplier quotation (SQ)", hoOnly: true };
    case "quotation":
      return { action: "po_issued", label: "Generate purchase order (PO)", hoOnly: true };
    case "po_issued":
      return { action: "billed", label: "Record vendor invoice", hoOnly: true };
    case "billed":
      return { action: "paid", label: "Mark bill paid", hoOnly: true };
    case "paid":
      return { action: "dispatched", label: "Dispatch to branch", hoOnly: true };
    case "dispatched":
      return { action: "received", label: "Confirm GRN / received", hoOnly: false };
    default:
      return null;
  }
}

export function lineAmount(qty: number, unitPrice: number): number {
  return Math.max(0, qty) * Math.max(0, unitPrice);
}

export function requisitionTotal(items: { qty: number; unitPrice: number }[]): number {
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
