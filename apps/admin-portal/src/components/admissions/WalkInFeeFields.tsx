"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  apiErrorMessage,
  sameProgram,
  type ApiAdditionalService,
  type ApiFeeDiscount,
  type ApiProgramFeeSummary,
} from "@/lib/admissions-api";
import { ALL_PROGRAMS, CYCLE_SUFFIX, discountValueLabel } from "@/lib/fees-api";
import { useCompanyCode } from "@/lib/hooks/use-company-code";
import { useFeeDiscounts } from "@/lib/hooks/use-fee-discounts";
import { cn, formatCurrency } from "@/lib/utils";

type Props = {
  branchCode: string;
  /** Preselected when the fee structures have a program of this name */
  suggestedProgram?: string;
  program: string;
  serviceIds: number[];
  discountCodes: string[];
  error?: string;
  onProgramChange: (program: string) => void;
  onServiceIdsChange: (ids: number[]) => void;
  onDiscountCodesChange: (codes: string[]) => void;
};

const toggle = <T,>(list: T[], value: T) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

/**
 * Walk-in wizard: staff pick the program, add-on services and discount codes for the
 * full-manual `feeProposal`, and the server prices them. `/fees/calculate` cannot price
 * specific add-ons and `calculate-fees` needs an inquiry, so the summary here is an
 * estimate from the same rules.
 */
export function WalkInFeeFields({
  branchCode,
  suggestedProgram,
  program,
  serviceIds,
  discountCodes,
  error,
  onProgramChange,
  onServiceIdsChange,
  onDiscountCodesChange,
}: Props) {
  const api = useApiClient();
  const { companyCode } = useCompanyCode();

  const scope = new URLSearchParams({ companyCode });
  if (branchCode) scope.set("branchCode", branchCode);

  const programsQuery = useQuery({
    queryKey: ["fee-programs", companyCode, branchCode],
    queryFn: () => api.get<ApiProgramFeeSummary>(`/fees/structures/programs?${scope}`),
    enabled: !!companyCode,
    staleTime: 5 * 60_000,
  });
  const programs = useMemo(() => programsQuery.data?.programs ?? [], [programsQuery.data]);
  const selectedProgram = programs.find((p) => p.gradeOrProgram === program);

  const servicesQuery = useQuery({
    queryKey: ["fee-addons", companyCode, branchCode, program],
    queryFn: () =>
      api.get<ApiAdditionalService[]>(
        `/fees/structures/additional-services?${scope}&gradeOrProgram=${encodeURIComponent(program)}`
      ),
    enabled: !!companyCode && !!program,
    staleTime: 5 * 60_000,
  });
  const services = useMemo(() => servicesQuery.data ?? [], [servicesQuery.data]);

  const discountsQuery = useFeeDiscounts(companyCode, branchCode);
  const discounts = useMemo(
    () =>
      (discountsQuery.data ?? []).filter(
        (d) =>
          d.active !== false &&
          (!d.applicableGrade || d.applicableGrade.toUpperCase() === ALL_PROGRAMS || sameProgram(d.applicableGrade, program))
      ),
    [discountsQuery.data, program]
  );

  useEffect(() => {
    if (!programsQuery.data) return;
    if (program && !selectedProgram) onProgramChange("");
    else if (!program) {
      const match = programs.find((p) => sameProgram(p.gradeOrProgram, suggestedProgram));
      if (match) onProgramChange(match.gradeOrProgram);
    }
  }, [programsQuery.data, programs, program, selectedProgram, suggestedProgram]);

  // Selected add-ons / discounts that no longer apply to the chosen program are dropped.
  useEffect(() => {
    if (!servicesQuery.data) return;
    const next = serviceIds.filter((id) => services.some((s) => s.id === id));
    if (next.length !== serviceIds.length) onServiceIdsChange(next);
  }, [servicesQuery.data, services, serviceIds]);

  useEffect(() => {
    if (!discountsQuery.data) return;
    const next = discountCodes.filter((c) => discounts.some((d) => d.discountCode === c));
    if (next.length !== discountCodes.length) onDiscountCodesChange(next);
  }, [discountsQuery.data, discounts, discountCodes]);

  const lines = [
    ...(selectedProgram?.coreFees ?? []),
    ...services.filter((s) => serviceIds.includes(s.id)),
  ];
  const gross = lines.reduce((sum, l) => sum + (l.baseAmount ?? 0), 0);
  const applied = discounts.filter((d) => discountCodes.includes(d.discountCode));
  const discountAmount = (d: ApiFeeDiscount) => {
    if (d.discountType !== "PERCENTAGE") return d.discountValue ?? 0;
    const base =
      !d.applicableServiceType || d.applicableServiceType.toUpperCase() === ALL_PROGRAMS
        ? gross
        : lines.filter((l) => l.serviceType === d.applicableServiceType).reduce((sum, l) => sum + (l.baseAmount ?? 0), 0);
    return (base * (d.discountValue ?? 0)) / 100;
  };
  const net = Math.max(0, gross - applied.reduce((sum, d) => sum + discountAmount(d), 0));

  return (
    <>
      <div>
        <Label>Program</Label>
        <p className="mt-0.5 text-xs text-muted">
          Auto-selected from date of birth when it matches a program with a fee structure. Staff can change it.
        </p>
        <Select value={program} onValueChange={onProgramChange} disabled={programsQuery.isPending}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder={programsQuery.isPending ? "Loading programs…" : "Select program"} />
          </SelectTrigger>
          <SelectContent>
            {programs.map((p) => (
              <SelectItem key={p.gradeOrProgram} value={p.gradeOrProgram}>
                {p.gradeOrProgram}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {programsQuery.isError ? (
          <p className="mt-1 text-xs text-danger">
            {apiErrorMessage(programsQuery.error, "Could not load the fee structures.")}
          </p>
        ) : (
          !programsQuery.isPending &&
          programs.length === 0 && (
            <p className="mt-1 text-xs text-danger">
              No programs have a fee structure yet — an admin sets them up under Finance → Fee Structures.
            </p>
          )
        )}
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>

      {program && (
        <div>
          <Label>Optional services</Label>
          {servicesQuery.isPending ? (
            <p className="mt-1 text-xs text-muted">Loading services…</p>
          ) : servicesQuery.isError ? (
            <p className="mt-1 text-xs text-danger">
              {apiErrorMessage(servicesQuery.error, "Could not load the optional services.")}
            </p>
          ) : services.length === 0 ? (
            <p className="mt-1 text-xs text-muted">No add-on services for this program.</p>
          ) : (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {services.map((s) => (
                <label
                  key={s.id}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm",
                    serviceIds.includes(s.id) ? "border-brand-500 bg-brand-50" : "border-[#DFE3E8]"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Checkbox
                      checked={serviceIds.includes(s.id)}
                      onCheckedChange={() => onServiceIdsChange(toggle(serviceIds, s.id))}
                    />
                    {s.feeName}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    +{formatCurrency(s.baseAmount ?? 0)}
                    {CYCLE_SUFFIX[s.billingCycle ?? ""] ?? ""}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {program && discounts.length > 0 && (
        <div>
          <Label>Discounts</Label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {discounts.map((d) => (
              <label
                key={d.discountCode}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm",
                  discountCodes.includes(d.discountCode) ? "border-brand-500 bg-brand-50" : "border-[#DFE3E8]"
                )}
              >
                <span className="flex items-center gap-2">
                  <Checkbox
                    checked={discountCodes.includes(d.discountCode)}
                    onCheckedChange={() => onDiscountCodesChange(toggle(discountCodes, d.discountCode))}
                  />
                  <span>
                    {d.name || d.discountCode}
                    <span className="block text-[10px] text-muted">{d.discountCode}</span>
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted">{discountValueLabel(d, formatCurrency)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {selectedProgram && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-800">Fee summary (estimate)</p>
          <dl className="mt-3 space-y-1.5 text-sm">
            {lines.map((l) => (
              <div key={l.id} className="flex justify-between">
                <dt className="text-muted">
                  {l.feeName ?? l.serviceType}
                  <span className="text-[10px]">{CYCLE_SUFFIX[l.billingCycle ?? ""] ?? ""}</span>
                </dt>
                <dd className="font-medium">{formatCurrency(l.baseAmount ?? 0)}</dd>
              </div>
            ))}
            {applied.map((d) => (
              <div key={d.discountCode} className="flex justify-between text-emerald-700">
                <dt>{d.name ?? d.discountCode}</dt>
                <dd>−{formatCurrency(discountAmount(d))}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-brand-200 pt-2 font-bold text-heading">
              <dt>First payment (estimated net)</dt>
              <dd>{formatCurrency(net)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-[11px] text-muted">The server sets the final amount when it issues the challan.</p>
        </div>
      )}
    </>
  );
}
