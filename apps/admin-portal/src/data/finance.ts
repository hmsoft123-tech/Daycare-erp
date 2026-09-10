export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

export type ChartAccount = {
  code: string;
  name: string;
  type: AccountType;
  parentCode?: string;
};

export type FinanceVoucherKind = "journal" | "cash" | "bank";

export type FinanceVoucher = {
  id: string;
  kind: FinanceVoucherKind;
  date: string;
  narration: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  branchId?: string;
  status: "draft" | "posted";
};

export type FixedAsset = {
  id: string;
  name: string;
  category: string;
  branchId: string;
  purchaseDate: string;
  cost: number;
  bookValue: number;
};

/** Chart of Accounts order: Current Assets → Liabilities → Equity → Revenue → Expenses */
export const chartOfAccounts: ChartAccount[] = [
  { code: "1000", name: "Current Assets", type: "asset" },
  { code: "1100", name: "Cash in Hand", type: "asset", parentCode: "1000" },
  { code: "1200", name: "Bank — Al Habib", type: "asset", parentCode: "1000" },
  { code: "1300", name: "Accounts Receivable (Fees)", type: "asset", parentCode: "1000" },
  { code: "1400", name: "Inventory — Course Materials", type: "asset", parentCode: "1000" },
  { code: "2000", name: "Liabilities", type: "liability" },
  { code: "2100", name: "Accounts Payable", type: "liability", parentCode: "2000" },
  { code: "2200", name: "Accrued Expenses", type: "liability", parentCode: "2000" },
  { code: "3000", name: "Equity", type: "equity" },
  { code: "3100", name: "Owner Capital", type: "equity", parentCode: "3000" },
  { code: "3200", name: "Retained Earnings", type: "equity", parentCode: "3000" },
  { code: "4000", name: "Revenue", type: "revenue" },
  { code: "4100", name: "Tuition Income", type: "revenue", parentCode: "4000" },
  { code: "4200", name: "Admission Fee Income", type: "revenue", parentCode: "4000" },
  { code: "5000", name: "Expenses", type: "expense" },
  { code: "5100", name: "Salaries & Wages", type: "expense", parentCode: "5000" },
  { code: "5200", name: "Utilities", type: "expense", parentCode: "5000" },
  { code: "5300", name: "Maintenance", type: "expense", parentCode: "5000" },
  { code: "5400", name: "Course Inventory COGS", type: "expense", parentCode: "5000" },
];

export const financeVouchers: FinanceVoucher[] = [
  {
    id: "jv-1",
    kind: "journal",
    date: "2026-09-01",
    narration: "Post September tuition accrual",
    debitAccount: "1300",
    creditAccount: "4100",
    amount: 2_400_000,
    status: "posted",
  },
  {
    id: "cv-1",
    kind: "cash",
    date: "2026-09-03",
    narration: "Petty cash — classroom supplies",
    debitAccount: "5400",
    creditAccount: "1100",
    amount: 12_500,
    branchId: "branch-nn",
    status: "posted",
  },
  {
    id: "bv-1",
    kind: "bank",
    date: "2026-09-05",
    narration: "KuickPay fee settlement",
    debitAccount: "1200",
    creditAccount: "1300",
    amount: 450_000,
    status: "posted",
  },
  {
    id: "jv-2",
    kind: "journal",
    date: "2026-09-08",
    narration: "Vendor bill — CoolAir AC service",
    debitAccount: "5300",
    creditAccount: "2100",
    amount: 28_000,
    status: "draft",
  },
];

export const fixedAssets: FixedAsset[] = [
  {
    id: "fa-1",
    name: "Split AC — Infant Room",
    category: "HVAC",
    branchId: "branch-nn",
    purchaseDate: "2024-03-12",
    cost: 185_000,
    bookValue: 142_000,
  },
  {
    id: "fa-2",
    name: "CCTV NVR + cameras",
    category: "Security",
    branchId: "branch-clifton",
    purchaseDate: "2023-11-01",
    cost: 320_000,
    bookValue: 210_000,
  },
  {
    id: "fa-3",
    name: "Generator 20kVA",
    category: "Power",
    branchId: "branch-dha",
    purchaseDate: "2022-06-20",
    cost: 980_000,
    bookValue: 640_000,
  },
];
