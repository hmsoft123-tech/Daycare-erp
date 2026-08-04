import type { Invoice } from "@/types";
import {
  LATE_FEE_AFTER_DUE,
  EXPIRY_SURCHARGE,
  billingMonthLabel,
  challanDueDate,
  challanValidityDate,
} from "@/lib/fee-challan";

function challanFields(
  issueDate: string,
  amount: number,
  opts?: { dueDate?: string; consumerNumber?: string; grNumber?: string }
) {
  return {
    issueDate,
    dueDate: opts?.dueDate ?? challanDueDate(issueDate),
    validityDate: challanValidityDate(issueDate),
    billingMonth: billingMonthLabel(issueDate),
    amountAfterDue: amount + LATE_FEE_AFTER_DUE,
    lateFeeAfterDue: LATE_FEE_AFTER_DUE,
    expirySurcharge: EXPIRY_SURCHARGE,
    consumerNumber: opts?.consumerNumber ?? "10000",
    grNumber: opts?.grNumber ?? "45000",
  };
}

export const invoices: Invoice[] = [
  {
    id: "inv1",
    invoiceNumber: "INV-2026-0142",
    studentId: "s1",
    branchId: "branch-nn",
    planType: "Full Day Monthly",
    amount: 35000,
    currency: "PKR",
    paidDate: "2026-07-03",
    status: "paid",
    lineItems: [
      { id: "li1", description: "Monthly Fee July (2026)", amount: 32000 },
      { id: "li2", description: "Meal Program July (2026)", amount: 3000 },
    ],
    ...challanFields("2026-07-01", 35000, {
      dueDate: "2026-07-08",
      consumerNumber: "10691",
      grNumber: "45341",
    }),
  },
  {
    id: "inv2",
    invoiceNumber: "INV-2026-0143",
    studentId: "s2",
    branchId: "branch-clifton",
    planType: "Half Day Monthly",
    amount: 22000,
    currency: "PKR",
    status: "overdue",
    lineItems: [
      { id: "li3", description: "Monthly Fee July (2026)", amount: 20000 },
      { id: "li4", description: "Activity Fee July (2026)", amount: 2000 },
    ],
    // Past due, still within 25-day validity
    ...challanFields("2026-07-15", 22000, {
      dueDate: "2026-07-22",
      consumerNumber: "10692",
      grNumber: "45342",
    }),
  },
  {
    id: "inv3",
    invoiceNumber: "INV-2026-0144",
    studentId: "s3",
    branchId: "branch-dha",
    planType: "Full Day Monthly",
    amount: 49000,
    currency: "PKR",
    status: "pending",
    lineItems: [
      { id: "li5", description: "Plus (1-8 Hours Extras) August (2026)", amount: 13000 },
      { id: "li6", description: "ANNUAL August (2026)", amount: 13000 },
      { id: "li7", description: "Monthly Fee August (2026)", amount: 13000 },
      { id: "li8", description: "Meal Program August (2026)", amount: 4000 },
      { id: "li9", description: "SDLC KinderGarten (L-P) August (2026)", amount: 6000 },
    ],
    ...challanFields("2026-08-01", 49000, {
      dueDate: "2026-08-08",
      consumerNumber: "10694",
      grNumber: "45349",
    }),
  },
  {
    id: "inv4",
    invoiceNumber: "INV-2026-0145",
    studentId: "s4",
    branchId: "branch-gulshan",
    planType: "After School",
    amount: 15000,
    currency: "PKR",
    paidDate: "2026-08-03",
    status: "partial",
    lineItems: [
      { id: "li10", description: "After School Program August (2026)", amount: 15000, discount: 5000 },
    ],
    ...challanFields("2026-08-01", 15000, {
      dueDate: "2026-08-08",
      consumerNumber: "10695",
      grNumber: "45350",
    }),
  },
  {
    id: "inv5",
    invoiceNumber: "INV-2026-0146",
    studentId: "s5",
    branchId: "branch-nn",
    planType: "Full Day Monthly",
    amount: 35000,
    currency: "PKR",
    paidDate: "2026-08-02",
    status: "paid",
    lineItems: [
      { id: "li11", description: "Monthly Fee August (2026)", amount: 32000 },
      { id: "li12", description: "Meal Program August (2026)", amount: 3000 },
    ],
    ...challanFields("2026-08-01", 35000, {
      consumerNumber: "10696",
      grNumber: "45351",
    }),
  },
  {
    id: "inv6",
    invoiceNumber: "INV-2026-0147",
    studentId: "s6",
    branchId: "branch-clifton",
    planType: "Full Day Monthly",
    amount: 38000,
    currency: "PKR",
    status: "pending",
    lineItems: [
      { id: "li13", description: "Monthly Fee August (2026)", amount: 35000 },
      { id: "li14", description: "Meal Program August (2026)", amount: 3000 },
    ],
    ...challanFields("2026-08-01", 38000, {
      dueDate: "2026-08-08",
      consumerNumber: "10697",
      grNumber: "45352",
    }),
  },
  {
    id: "inv7",
    invoiceNumber: "INV-2026-0148",
    studentId: "s1",
    branchId: "branch-nn",
    planType: "Full Day Monthly",
    amount: 35000,
    currency: "PKR",
    status: "expired",
    lineItems: [
      { id: "li15", description: "Monthly Fee June (2026)", amount: 35000 },
    ],
    ...challanFields("2026-06-01", 35000, {
      dueDate: "2026-06-08",
      consumerNumber: "10691",
      grNumber: "45341",
    }),
  },
  {
    id: "inv8",
    invoiceNumber: "INV-2026-0149",
    studentId: "s1",
    branchId: "branch-nn",
    planType: "Full Day Monthly",
    amount: 35000,
    currency: "PKR",
    paidDate: "2026-06-02",
    status: "paid",
    lineItems: [
      { id: "li16", description: "Monthly Fee May (2026)", amount: 32000 },
      { id: "li17", description: "Meal Program May (2026)", amount: 3000 },
    ],
    ...challanFields("2026-05-01", 35000, {
      consumerNumber: "10691",
      grNumber: "45341",
    }),
  },
];

export const revenueData = [
  { month: "Jan", revenue: 2100000 },
  { month: "Feb", revenue: 2250000 },
  { month: "Mar", revenue: 2180000 },
  { month: "Apr", revenue: 2320000 },
  { month: "May", revenue: 2450000 },
  { month: "Jun", revenue: 2400000 },
];

export const branchRevenue = [
  { branchId: "branch-nn", month: "Jan", revenue: 520000 },
  { branchId: "branch-clifton", month: "Jan", revenue: 480000 },
  { branchId: "branch-dha", month: "Jan", revenue: 610000 },
  { branchId: "branch-gulshan", month: "Jan", revenue: 490000 },
  { branchId: "branch-nn", month: "Feb", revenue: 540000 },
  { branchId: "branch-clifton", month: "Feb", revenue: 510000 },
  { branchId: "branch-dha", month: "Feb", revenue: 620000 },
  { branchId: "branch-gulshan", month: "Feb", revenue: 580000 },
  { branchId: "branch-nn", month: "Mar", revenue: 530000 },
  { branchId: "branch-clifton", month: "Mar", revenue: 500000 },
  { branchId: "branch-dha", month: "Mar", revenue: 600000 },
  { branchId: "branch-gulshan", month: "Mar", revenue: 550000 },
  { branchId: "branch-nn", month: "Apr", revenue: 560000 },
  { branchId: "branch-clifton", month: "Apr", revenue: 520000 },
  { branchId: "branch-dha", month: "Apr", revenue: 640000 },
  { branchId: "branch-gulshan", month: "Apr", revenue: 560000 },
  { branchId: "branch-nn", month: "May", revenue: 580000 },
  { branchId: "branch-clifton", month: "May", revenue: 550000 },
  { branchId: "branch-dha", month: "May", revenue: 660000 },
  { branchId: "branch-gulshan", month: "May", revenue: 660000 },
  { branchId: "branch-nn", month: "Jun", revenue: 570000 },
  { branchId: "branch-clifton", month: "Jun", revenue: 540000 },
  { branchId: "branch-dha", month: "Jun", revenue: 650000 },
  { branchId: "branch-gulshan", month: "Jun", revenue: 640000 },
];
