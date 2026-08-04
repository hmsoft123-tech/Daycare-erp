/**
 * SDLC fee challan rules (from Dr. Sofia’s Daycare fee voucher):
 * - Issue date, due date, validity date (25-day validity window)
 * - After due date: late charges Rs. 1000
 * - After expiry: voucher invalid; additional Rs. 1000 surcharge as arrears next cycle
 * - Fee in advance monthly · no installments · IBFT not allowed
 */

export const CHALLAN_VALIDITY_DAYS = 25;
/** Default days from issue to due (sample: 1 Mar → 8 Mar) */
export const CHALLAN_DUE_DAYS = 7;
export const LATE_FEE_AFTER_DUE = 1000;
export const EXPIRY_SURCHARGE = 1000;

export const CHALLAN_BANK = {
  bankName: "Bank Al Habib Limited",
  branchNote: "(All Karachi Branches)",
  collectionAccountNo: "0080-900647-01",
  ibanNote: "5005-0980-006490-01-5",
  heldWith: "IB North Nazimabad Branch, Karachi",
  schoolName: "Dr. Sofia's Daycare and Learning Center",
  address: "B-43 BLOCK-N, North Nazimabad, Karachi",
} as const;

export const CHALLAN_TERMS = [
  "Fee is payable in advance every month.",
  `After due date, late charges of Rs. ${LATE_FEE_AFTER_DUE.toLocaleString()} will be charged.`,
  "After expiry date, the fee voucher will no longer be valid and will expire from all payment platforms including over the counter.",
  `If the fee voucher has not been cleared on or before expiry date then an additional late surcharge of Rs. ${EXPIRY_SURCHARGE.toLocaleString()} (Total Rs. ${(LATE_FEE_AFTER_DUE + EXPIRY_SURCHARGE).toLocaleString()}) will be added on as arrears at the time of the next billing cycle.`,
  "Interbank Funds Transfer (IBFT) is not allowed.",
  "Fee will not be accepted in instalments.",
] as const;

export function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Inclusive 25-day window: issue day = day 1 → validity = issue + 24 */
export function challanValidityDate(issueDate: string): string {
  return addDaysIso(issueDate, CHALLAN_VALIDITY_DAYS - 1);
}

export function challanDueDate(issueDate: string, override?: string): string {
  if (override) return override;
  return addDaysIso(issueDate, CHALLAN_DUE_DAYS);
}

export function billingMonthLabel(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" }).replace(
    /(\w+) (\d+)/,
    "$1 ($2)"
  );
}

export function formatChallanDate(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  const day = String(d.getDate()).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isChallanExpired(validityDate: string, asOf = todayIso()): boolean {
  return asOf > validityDate;
}

export function isPastDue(dueDate: string, asOf = todayIso()): boolean {
  return asOf > dueDate;
}

export function payableAmount(input: {
  amount: number;
  amountAfterDue: number;
  dueDate: string;
  validityDate: string;
  status: string;
  asOf?: string;
}): number {
  const asOf = input.asOf ?? todayIso();
  if (input.status === "paid" || input.status === "partial") return input.amount;
  if (isChallanExpired(input.validityDate, asOf) || isPastDue(input.dueDate, asOf)) {
    return input.amountAfterDue;
  }
  return input.amount;
}
