"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Loader2, Receipt, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModalPortal } from "@/components/ui/modal-portal";
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
  calculateFeesBody,
  sameProgram,
  type ApiAdditionalService,
  type ApiFeeDiscount,
  type ApiFeeProposal,
  type ApiProgramFeeSummary,
  type FeeSelection,
} from "@/lib/admissions-api";
import { useBranches } from "@/lib/hooks/use-branches";
import { useCompanyCode } from "@/lib/hooks/use-company-code";
import { cn, formatCurrency } from "@/lib/utils";
import type { AdmissionCard } from "@/types";

type Props = {
  open: boolean;
  card: Pick<AdmissionCard, "id" | "studentName" | "program" | "branchId"> | null;
  onCancel: () => void;
  onConfirm: (selection: FeeSelection) => void;
};

const CYCLE: Record<string, string> = {
  MONTHLY: "/mo",
  ONE_TIME: " one-time",
  ANNUAL: "/yr",
  QUARTERLY: "/qtr",
  PER_HOUR: "/hr",
};

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * Stage 3a. Staff choose the program, optional add-on services and discount codes;
 * every amount comes from the company's fee structures. `calculate-fees` previews
 * the package (saved as a DRAFT), `propose-fees` sends it for branch approval.
 */
export function ProposeFeesModal({ open, card, onCancel, onConfirm }: Props) {
  const api = useApiClient();
  const { companyCode } = useCompanyCode();
  const { branches } = useBranches();

  const [program, setProgram] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [discountCodes, setDiscountCodes] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const visible = open && !!card;
  const inquiryId = card?.id ?? "";

  // Fee-structure lookups are scoped to the branch so branch overrides apply.
  const scope = new URLSearchParams({ companyCode });
  if (branchCode) scope.set("branchCode", branchCode);

  const programsQuery = useQuery({
    queryKey: ["fee-programs", companyCode, branchCode],
    queryFn: () => api.get<ApiProgramFeeSummary>(`/fees/structures/programs?${scope}`),
    enabled: visible && !!companyCode,
    staleTime: 5 * 60_000,
  });
  const programs = useMemo(() => programsQuery.data?.programs ?? [], [programsQuery.data]);

  const servicesQuery = useQuery({
    queryKey: ["fee-addons", companyCode, branchCode, program],
    queryFn: () =>
      api.get<ApiAdditionalService[]>(
        `/fees/structures/additional-services?${scope}&gradeOrProgram=${encodeURIComponent(program)}`
      ),
    enabled: visible && !!companyCode && !!program,
    staleTime: 5 * 60_000,
  });
  const services = servicesQuery.data ?? programsQuery.data?.additionalServices ?? [];

  const discountsQuery = useQuery({
    queryKey: ["fee-discounts", companyCode, branchCode],
    queryFn: () => api.get<ApiFeeDiscount[]>(`/fees/discounts?${scope}`),
    enabled: visible && !!companyCode,
    staleTime: 5 * 60_000,
  });
  const discounts = (discountsQuery.data ?? []).filter(
    (d) =>
      d.active !== false &&
      (!d.applicableGrade || d.applicableGrade.toUpperCase() === "ALL" || sameProgram(d.applicableGrade, program))
  );

  // Reset each time the dialog opens for a card; preselect the inquiry's program and branch.
  useEffect(() => {
    if (!visible) return;
    setProgram("");
    setBranchCode(card?.branchId ?? "");
    setServiceIds([]);
    setDiscountCodes([]);
    setNotes("");
  }, [visible, card?.id, card?.branchId]);

  useEffect(() => {
    if (!visible || program || !programs.length) return;
    const match = programs.find((p) => sameProgram(p.gradeOrProgram, card?.program));
    if (match) setProgram(match.gradeOrProgram);
  }, [visible, program, programs, card?.program]);

  // Selected add-ons / discounts that no longer apply to the chosen program are dropped.
  useEffect(() => {
    if (!servicesQuery.data) return;
    setServiceIds((ids) => ids.filter((id) => servicesQuery.data.some((s) => s.id === id)));
  }, [servicesQuery.data]);

  const selection: FeeSelection = {
    gradeOrProgram: program,
    branchCode: branchCode || undefined,
    additionalServiceIds: serviceIds,
    discountCodes: discountCodes.filter((c) => discounts.some((d) => d.discountCode === c)),
    notes: notes.trim(),
  };
  const previewKey = useDebounced(
    JSON.stringify({ ...calculateFeesBody(selection), notes: undefined }),
    350
  );

  const preview = useQuery({
    queryKey: ["fee-preview", inquiryId, previewKey],
    queryFn: () =>
      api.post<ApiFeeProposal>(`/admissions/inquiries/${inquiryId}/calculate-fees`, JSON.parse(previewKey)),
    enabled: visible && !!program,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: 0,
  });

  const toggle = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const selectedProgram = programs.find((p) => p.gradeOrProgram === program);
  const quote = program ? preview.data : undefined;
  const canSubmit = !!program && !!quote && !preview.isError && !preview.isFetching;

  return (
    <ModalPortal open={visible} onClose={onCancel} maxWidth="max-w-2xl">
      <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <Receipt className="h-5 w-5 text-brand-500" />
            Propose enrollment fees
          </h2>
          {card && (
            <p className="mt-1 text-sm text-muted">
              <span className="font-semibold text-heading">{card.studentName}</span> — amounts come from the
              fee structure; the branch admin and then the company approve them before payment.
            </p>
          )}
        </div>
        <button type="button" onClick={onCancel} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Program</Label>
            <Select value={program} onValueChange={setProgram} disabled={programsQuery.isPending}>
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
          </div>
          <div>
            <Label>Branch</Label>
            <Select value={branchCode} onValueChange={setBranchCode}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Inquiry's branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.code} value={b.code}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedProgram?.coreFees?.length ? (
          <div className="rounded-xl border border-[#F1F3F5] p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Core fees</p>
            <ul className="space-y-1 text-sm">
              {selectedProgram.coreFees.map((f) => (
                <li key={f.id} className="flex justify-between">
                  <span className="text-heading">{f.feeName ?? f.serviceType}</span>
                  <span className="text-muted">
                    {formatCurrency(f.baseAmount ?? 0)}
                    {CYCLE[f.billingCycle ?? ""] ?? ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {program && (
          <div>
            <Label>Optional services</Label>
            {servicesQuery.isPending ? (
              <p className="mt-1 text-xs text-muted">Loading services…</p>
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
                        onCheckedChange={() => setServiceIds((ids) => toggle(ids, s.id))}
                      />
                      {s.feeName}
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      +{formatCurrency(s.baseAmount ?? 0)}
                      {CYCLE[s.billingCycle ?? ""] ?? ""}
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
                      onCheckedChange={() => setDiscountCodes((codes) => toggle(codes, d.discountCode))}
                    />
                    <span>
                      {d.name || d.discountCode}
                      <span className="block text-[10px] text-muted">{d.discountCode}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {d.discountType === "PERCENTAGE"
                      ? `${d.discountValue ?? 0}%`
                      : formatCurrency(d.discountValue ?? 0)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="proposeFeeNotes">Fee notes</Label>
          <Textarea
            id="proposeFeeNotes"
            className="mt-1"
            rows={2}
            maxLength={500}
            placeholder="e.g. Older sibling enrolled in Nursery (verified)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {program && (
          <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-800">
              Fee summary
              {preview.isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
            </p>
            {preview.isError ? (
              <p className="mt-2 text-xs text-danger">
                {apiErrorMessage(preview.error, "Could not calculate the fees.")}
              </p>
            ) : !quote ? (
              <p className="mt-2 text-xs text-muted">Calculating…</p>
            ) : (
              <dl className="mt-3 space-y-1.5 text-sm">
                {(quote.lineItems ?? []).map((line, i) => (
                  <div key={`${line.feeStructureId ?? i}-${i}`} className="flex justify-between">
                    <dt className="text-muted">
                      {line.lineDescription ?? line.feeName ?? line.serviceType}
                      {line.billingCycle ? (
                        <span className="text-[10px]">{CYCLE[line.billingCycle] ?? ""}</span>
                      ) : null}
                    </dt>
                    <dd className="font-medium">{formatCurrency(line.lineTotal ?? line.amount ?? 0)}</dd>
                  </div>
                ))}
                {(quote.discounts ?? []).map((d, i) => (
                  <div key={`${d.discountCode ?? i}-d`} className="flex justify-between text-emerald-700">
                    <dt>{d.name ?? d.discountCode}</dt>
                    <dd>−{formatCurrency(d.calculatedDiscountAmount ?? 0)}</dd>
                  </div>
                ))}
                <div className="flex justify-between border-t border-brand-200 pt-2 font-bold text-heading">
                  <dt>First payment (net)</dt>
                  <dd>{formatCurrency(quote.netAmount ?? 0)}</dd>
                </div>
                <div className="flex justify-between text-xs text-muted">
                  <dt>Ongoing monthly</dt>
                  <dd>{formatCurrency(quote.monthlyRecurringAmount ?? 0)}</dd>
                </div>
                <div className="flex justify-between text-xs text-muted">
                  <dt>One-time</dt>
                  <dd>{formatCurrency(quote.oneTimeAmount ?? 0)}</dd>
                </div>
              </dl>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" disabled={!canSubmit} onClick={() => onConfirm(selection)}>
          Propose fees
        </Button>
      </div>
    </ModalPortal>
  );
}
