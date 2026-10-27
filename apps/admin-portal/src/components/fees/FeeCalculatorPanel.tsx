"use client";

import { useState } from "react";
import { Calculator, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApiClient } from "@/lib/api";
import { apiErrorMessage } from "@/lib/admissions-api";
import {
  CYCLE_SUFFIX,
  SERVICE_TYPES,
  discountValueLabel,
  serviceTypeLabel,
  type ApiDiscountRule,
  type ApiFeeCalculation,
} from "@/lib/fees-api";
import { cn, formatCurrency } from "@/lib/utils";

type Props = {
  companyCode: string;
  /** Branch scope selected on the page ("" = company-wide prices) */
  branchCode: string;
  programs: string[];
  discounts: ApiDiscountRule[];
};

/**
 * `POST /fees/calculate` — checks what a program costs under the current rules
 * before any inquiry is priced. Nothing is saved.
 */
export function FeeCalculatorPanel({ companyCode, branchCode, programs, discounts }: Props) {
  const api = useApiClient();
  const [program, setProgram] = useState("");
  const [serviceTypes, setServiceTypes] = useState<string[]>(["TUITION", "ADMISSION"]);
  const [codes, setCodes] = useState<string[]>([]);
  const [result, setResult] = useState<ApiFeeCalculation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const activeDiscounts = discounts.filter((d) => d.active !== false);

  const calculate = async () => {
    if (!program || !serviceTypes.length || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api.post<ApiFeeCalculation>("/fees/calculate", {
        companyCode,
        branchCode: branchCode || undefined,
        gradeOrProgram: program,
        serviceTypes,
        appliedDiscountCodes: codes,
      });
      setResult(r);
    } catch (e) {
      setResult(null);
      setError(apiErrorMessage(e, "Could not calculate the fees."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="grid gap-6 p-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-heading">
              <Calculator className="h-4 w-4 text-brand-500" />
              Fee calculator
            </h2>
            <p className="text-xs text-muted">
              Try the rules before staff use them. This is a preview only — nothing is saved.
            </p>
          </div>
          <div>
            <Label>Program</Label>
            <Select value={program} onValueChange={setProgram}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={programs.length ? "Select program" : "Add program fees first"} />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fee types to include</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {SERVICE_TYPES.map((s) => (
                <label key={s.value} className="flex items-center gap-2 text-sm text-heading">
                  <Checkbox
                    checked={serviceTypes.includes(s.value)}
                    onCheckedChange={() => setServiceTypes((l) => toggle(l, s.value))}
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>
          {activeDiscounts.length > 0 && (
            <div>
              <Label>Discount codes</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeDiscounts.map((d) => (
                  <button
                    key={d.discountCode}
                    type="button"
                    aria-pressed={codes.includes(d.discountCode)}
                    onClick={() => setCodes((l) => toggle(l, d.discountCode))}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold",
                      codes.includes(d.discountCode)
                        ? "border-brand-500 bg-brand-50 text-brand-800"
                        : "border-[#DFE3E8] text-muted hover:text-heading"
                    )}
                  >
                    {d.discountCode} · {discountValueLabel(d, formatCurrency)}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Button type="button" disabled={!program || !serviceTypes.length || busy} onClick={() => void calculate()}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Calculate
          </Button>
        </div>

        <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-800">Result</p>
          {error ? (
            <p className="mt-2 text-sm text-danger">{error}</p>
          ) : !result ? (
            <p className="mt-2 text-sm text-muted">Pick a program and press Calculate.</p>
          ) : (
            <dl className="mt-3 space-y-1.5 text-sm">
              {(result.items ?? []).length === 0 && (
                <p className="text-xs text-muted">No fee rules match this program and fee types.</p>
              )}
              {(result.items ?? []).map((item, i) => (
                <div key={`${item.feeName}-${i}`} className="flex justify-between gap-3">
                  <dt className="text-muted">
                    {item.feeName ?? serviceTypeLabel(item.serviceType)}
                    <span className="text-[10px]">{CYCLE_SUFFIX[item.billingCycle ?? ""] ?? ""}</span>
                    {item.branchOverrideApplied && (
                      <span className="ml-1 rounded bg-surface px-1 text-[10px] text-brand-700">branch price</span>
                    )}
                  </dt>
                  <dd className="font-medium">{formatCurrency(item.baseAmount ?? 0)}</dd>
                </div>
              ))}
              {(result.discounts ?? []).map((d, i) => (
                <div key={`${d.discountCode}-${i}`} className="flex justify-between text-emerald-700">
                  <dt>{d.name ?? d.discountCode}</dt>
                  <dd>−{formatCurrency(d.calculatedDiscountAmount ?? 0)}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-brand-200 pt-2 text-muted">
                <dt>Gross</dt>
                <dd>{formatCurrency(result.grossAmount ?? 0)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Total discount</dt>
                <dd>−{formatCurrency(result.totalDiscount ?? 0)}</dd>
              </div>
              <div className="flex justify-between font-bold text-heading">
                <dt>Net</dt>
                <dd>{formatCurrency(result.netAmount ?? 0)}</dd>
              </div>
            </dl>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
