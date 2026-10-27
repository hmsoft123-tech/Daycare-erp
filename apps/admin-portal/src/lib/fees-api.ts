import type { ApiFeeDiscount, ApiFeeStructure } from "@/lib/admissions-api";

/**
 * KinderPilot fee setup (`/api/v1/fees/*`, reached through `/api/bff`): the fee
 * structure rules and discount templates that `calculate-fees` / `propose-fees`
 * price every admission from. Shapes copied from the backend's OpenAPI spec.
 */

export const SERVICE_TYPES = [
  { value: "TUITION", label: "Tuition" },
  { value: "ADMISSION", label: "Admission" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "MEAL_PLAN", label: "Meal plan" },
  { value: "DAYCARE_HOURLY", label: "Daycare (hourly)" },
  { value: "LAB_FEE", label: "Lab fee" },
  { value: "SECURITY_DEPOSIT", label: "Security deposit" },
  { value: "ANNUAL_CHARGES", label: "Annual charges" },
  { value: "ACTIVITY_FEE", label: "Activity fee" },
  { value: "OTHER", label: "Other" },
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number]["value"];

export const BILLING_CYCLES = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "ONE_TIME", label: "One-time" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "ANNUAL", label: "Annual" },
  { value: "PER_HOUR", label: "Per hour" },
] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number]["value"];

/** Short suffix after an amount: "PKR 850/mo". */
export const CYCLE_SUFFIX: Record<string, string> = {
  MONTHLY: "/mo",
  ONE_TIME: " one-time",
  ANNUAL: "/yr",
  QUARTERLY: "/qtr",
  PER_HOUR: "/hr",
};

export const serviceTypeLabel = (v: string | null | undefined) =>
  SERVICE_TYPES.find((s) => s.value === v)?.label ?? v ?? "—";
export const billingCycleLabel = (v: string | null | undefined) =>
  BILLING_CYCLES.find((c) => c.value === v)?.label ?? v ?? "—";

/** Programs / grades a rule can target; "ALL" applies it to every program. */
export const ALL_PROGRAMS = "ALL";

/** `FeeStructureResponse` from `GET /fees/structures`. */
export type ApiFeeRule = ApiFeeStructure & {
  companyCode?: string | null;
  branchCode?: string | null;
  isTaxable?: boolean | null;
  active?: boolean | null;
  isAdditionalService?: boolean | null;
  displayOrder?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

/** `FeeStructureRequest` — body of `POST /fees/structures` and `PUT /fees/structures/{id}`. */
export type FeeRuleForm = {
  branchCode: string;
  gradeOrProgram: string;
  serviceType: ServiceType;
  feeName: string;
  billingCycle: BillingCycle;
  baseAmount: string;
  isTaxable: boolean;
  active: boolean;
  isAdditionalService: boolean;
  displayOrder: string;
};

export const EMPTY_FEE_RULE: FeeRuleForm = {
  branchCode: "",
  gradeOrProgram: "",
  serviceType: "TUITION",
  feeName: "",
  billingCycle: "MONTHLY",
  baseAmount: "",
  isTaxable: false,
  active: true,
  isAdditionalService: false,
  displayOrder: "",
};

export function feeRuleForm(rule: ApiFeeRule): FeeRuleForm {
  return {
    branchCode: rule.branchCode ?? "",
    gradeOrProgram: rule.gradeOrProgram ?? "",
    serviceType: (rule.serviceType as ServiceType) ?? "OTHER",
    feeName: rule.feeName ?? "",
    billingCycle: (rule.billingCycle as BillingCycle) ?? "MONTHLY",
    baseAmount: rule.baseAmount != null ? String(rule.baseAmount) : "",
    isTaxable: !!rule.isTaxable,
    active: rule.active !== false,
    isAdditionalService: !!rule.isAdditionalService,
    displayOrder: rule.displayOrder != null ? String(rule.displayOrder) : "",
  };
}

export function validateFeeRule(f: FeeRuleForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!f.feeName.trim()) errors.feeName = "Required";
  if (!f.gradeOrProgram.trim()) errors.gradeOrProgram = `Required — use ${ALL_PROGRAMS} for every program`;
  const amount = Number(f.baseAmount);
  if (f.baseAmount.trim() === "" || !Number.isFinite(amount) || amount < 0) errors.baseAmount = "Enter an amount of 0 or more";
  if (f.displayOrder.trim() && !Number.isInteger(Number(f.displayOrder))) errors.displayOrder = "Whole number";
  return errors;
}

export function feeRuleBody(companyCode: string, f: FeeRuleForm) {
  return {
    companyCode,
    branchCode: f.branchCode || undefined,
    gradeOrProgram: f.gradeOrProgram.trim(),
    serviceType: f.serviceType,
    feeName: f.feeName.trim(),
    billingCycle: f.billingCycle,
    baseAmount: Number(f.baseAmount),
    isTaxable: f.isTaxable,
    active: f.active,
    isAdditionalService: f.isAdditionalService,
    displayOrder: f.displayOrder.trim() ? Number(f.displayOrder) : undefined,
  };
}

/** `FeeDiscountResponse` from `GET /fees/discounts`. */
export type ApiDiscountRule = ApiFeeDiscount & {
  companyCode?: string | null;
  branchCode?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

/** `FeeDiscountRequest` — body of `POST /fees/discounts` and `PUT /fees/discounts/{id}`. */
export type DiscountForm = {
  branchCode: string;
  name: string;
  discountCode: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: string;
  /** A service type, or "ALL" for the whole gross amount */
  applicableServiceType: string;
  applicableGrade: string;
  active: boolean;
};

export const EMPTY_DISCOUNT: DiscountForm = {
  branchCode: "",
  name: "",
  discountCode: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  applicableServiceType: "TUITION",
  applicableGrade: ALL_PROGRAMS,
  active: true,
};

export function discountForm(d: ApiDiscountRule): DiscountForm {
  return {
    branchCode: d.branchCode ?? "",
    name: d.name ?? "",
    discountCode: d.discountCode,
    discountType: d.discountType ?? "PERCENTAGE",
    discountValue: d.discountValue != null ? String(d.discountValue) : "",
    applicableServiceType: d.applicableServiceType || ALL_PROGRAMS,
    applicableGrade: d.applicableGrade || ALL_PROGRAMS,
    active: d.active !== false,
  };
}

export function validateDiscount(f: DiscountForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!f.name.trim()) errors.name = "Required";
  if (!/^[A-Z0-9_-]{2,40}$/.test(f.discountCode.trim())) errors.discountCode = "2–40 characters: A–Z, 0–9, _ -";
  const value = Number(f.discountValue);
  if (f.discountValue.trim() === "" || !Number.isFinite(value) || value <= 0) errors.discountValue = "Enter a value above 0";
  else if (f.discountType === "PERCENTAGE" && value > 100) errors.discountValue = "At most 100%";
  return errors;
}

export function discountBody(companyCode: string, f: DiscountForm) {
  return {
    companyCode,
    branchCode: f.branchCode || undefined,
    name: f.name.trim(),
    discountCode: f.discountCode.trim(),
    discountType: f.discountType,
    discountValue: Number(f.discountValue),
    applicableServiceType: f.applicableServiceType,
    applicableGrade: f.applicableGrade.trim() || ALL_PROGRAMS,
    active: f.active,
  };
}

export function discountValueLabel(d: { discountType?: string | null; discountValue?: number | null }, money: (n: number) => string) {
  return d.discountType === "PERCENTAGE" ? `${d.discountValue ?? 0}%` : money(d.discountValue ?? 0);
}

/** `FeeCalculationResponse` from `POST /fees/calculate` (preview only, nothing is saved). */
export type ApiFeeCalculation = {
  companyCode?: string | null;
  branchCode?: string | null;
  gradeOrProgram?: string | null;
  items?:
    | {
        feeName?: string | null;
        serviceType?: string | null;
        billingCycle?: string | null;
        baseAmount?: number | null;
        branchOverrideApplied?: boolean | null;
      }[]
    | null;
  discounts?:
    | {
        discountCode?: string | null;
        name?: string | null;
        calculatedDiscountAmount?: number | null;
      }[]
    | null;
  grossAmount?: number | null;
  totalDiscount?: number | null;
  netAmount?: number | null;
};

/** Query keys the fee setup screens and the propose-fees dialog read — invalidate all after a change. */
export const FEE_SETUP_QUERY_KEYS = [["fee-rules"], ["fee-programs"], ["fee-addons"], ["fee-discounts"], ["fee-preview"]];
