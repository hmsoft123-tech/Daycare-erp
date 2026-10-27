"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BadgePercent,
  ClipboardList,
  CreditCard,
  Loader2,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Settings2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ModalPortal } from "@/components/ui/modal-portal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FeeRuleModal } from "./FeeRuleModal";
import { DiscountRuleModal } from "./DiscountRuleModal";
import { FeeCalculatorPanel } from "./FeeCalculatorPanel";
import { useCan } from "@/components/security/Can";
import { useApiClient } from "@/lib/api";
import { apiErrorMessage, sameProgram, type ApiProgramFeeSummary } from "@/lib/admissions-api";
import {
  ALL_PROGRAMS,
  CYCLE_SUFFIX,
  EMPTY_DISCOUNT,
  EMPTY_FEE_RULE,
  FEE_SETUP_QUERY_KEYS,
  billingCycleLabel,
  discountBody,
  discountForm,
  discountValueLabel,
  feeRuleBody,
  feeRuleForm,
  serviceTypeLabel,
  type ApiDiscountRule,
  type ApiFeeRule,
  type DiscountForm,
  type FeeRuleForm,
} from "@/lib/fees-api";
import { branchLabel, useBranches } from "@/lib/hooks/use-branches";
import { useCompanyCode } from "@/lib/hooks/use-company-code";
import { cn, formatCurrency } from "@/lib/utils";

const COMPANY_WIDE = "__company";

/** How a fee travels from these rules to a paid challan. */
const FLOW = [
  {
    icon: Settings2,
    title: "1. Set up fees",
    who: "Admin · Finance admin",
    text: "Program fees, optional services and discount codes on this page. A branch rule overrides the company-wide price.",
    href: null,
  },
  {
    icon: ClipboardList,
    title: "2. Propose",
    who: "Admissions staff",
    text: "On the inquiry, pick the program, add-ons and discount codes. The server prices it as a draft; Propose sends it for approval.",
    href: "/admissions",
  },
  {
    icon: BadgeCheck,
    title: "3. Branch approval",
    who: "Branch admin",
    text: "Approves the package, or rejects it with a reason so staff can re-propose.",
    href: "/admissions/branch-fee-approvals",
  },
  {
    icon: Lock,
    title: "4. Company lock",
    who: "Head Office · Finance",
    text: "Locks the approved package exactly as proposed, issues the challan and emails the payment link.",
    href: "/admissions/company-fee-approvals",
  },
  {
    icon: CreditCard,
    title: "5. Payment",
    who: "Accounts",
    text: "Mark the challan paid — the child becomes an active student.",
    href: "/admissions",
  },
] as const;

type Deactivating = { kind: "rule"; item: ApiFeeRule } | { kind: "discount"; item: ApiDiscountRule };

/**
 * Admin fee setup: `GET/POST/PUT/DELETE /fees/structures`, `GET/POST/PUT/DELETE
 * /fees/discounts`, the program summary (`/fees/structures/programs`) and the
 * calculator (`/fees/calculate`). These rules are what `calculate-fees` /
 * `propose-fees` price every admission from.
 */
export function FeeSetupHub() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const canManage = useCan("fees.manage");
  const { companyCode, resolved, companyName, isLoading: companyLoading } = useCompanyCode();
  const { branches } = useBranches();

  const [scope, setScope] = useState(COMPANY_WIDE);
  const branchCode = scope === COMPANY_WIDE ? "" : scope;
  const [showInactive, setShowInactive] = useState(false);

  const [ruleModal, setRuleModal] = useState<{ id: number | null; initial: FeeRuleForm } | null>(null);
  const [discountModal, setDiscountModal] = useState<{ id: number | null; initial: DiscountForm } | null>(null);
  const [deactivating, setDeactivating] = useState<Deactivating | null>(null);
  const [saving, setSaving] = useState(false);

  const params = new URLSearchParams({ companyCode });
  if (branchCode) params.set("branchCode", branchCode);
  const enabled = !!companyCode && !companyLoading;

  const rulesQuery = useQuery({
    queryKey: ["fee-rules", companyCode, branchCode],
    queryFn: () => api.get<ApiFeeRule[]>(`/fees/structures?${params}`),
    enabled,
  });
  const discountsQuery = useQuery({
    queryKey: ["fee-discounts", companyCode, branchCode],
    queryFn: () => api.get<ApiDiscountRule[]>(`/fees/discounts?${params}`),
    enabled,
  });
  const summaryQuery = useQuery({
    queryKey: ["fee-programs", companyCode, branchCode],
    queryFn: () => api.get<ApiProgramFeeSummary>(`/fees/structures/programs?${params}`),
    enabled,
    retry: 0,
  });

  const rules = useMemo(
    () => (rulesQuery.data ?? []).filter((r) => showInactive || r.active !== false),
    [rulesQuery.data, showInactive]
  );
  const discounts = discountsQuery.data ?? [];

  const programNames = useMemo(() => {
    const names = new Set<string>();
    for (const r of rulesQuery.data ?? []) {
      if (r.gradeOrProgram && r.gradeOrProgram.toUpperCase() !== ALL_PROGRAMS) names.add(r.gradeOrProgram);
    }
    for (const p of summaryQuery.data?.programs ?? []) names.add(p.gradeOrProgram);
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [rulesQuery.data, summaryQuery.data]);

  // Core fees grouped by program ("ALL" first); add-ons listed separately.
  const programGroups = useMemo(() => {
    const groups = new Map<string, ApiFeeRule[]>();
    for (const r of rules) {
      if (r.isAdditionalService) continue;
      const key = r.gradeOrProgram || ALL_PROGRAMS;
      groups.set(key, [...(groups.get(key) ?? []), r]);
    }
    const order = (r: ApiFeeRule) => r.displayOrder ?? Number.MAX_SAFE_INTEGER;
    return [...groups.entries()]
      .sort(([a], [b]) => (a.toUpperCase() === ALL_PROGRAMS ? -1 : b.toUpperCase() === ALL_PROGRAMS ? 1 : a.localeCompare(b)))
      .map(([program, list]) => ({ program, list: [...list].sort((a, b) => order(a) - order(b)) }));
  }, [rules]);
  const addOns = rules.filter((r) => r.isAdditionalService);

  const refresh = () => {
    for (const queryKey of FEE_SETUP_QUERY_KEYS) void queryClient.invalidateQueries({ queryKey });
  };

  const saveRule = async (form: FeeRuleForm) => {
    if (!ruleModal || saving) return;
    setSaving(true);
    try {
      const body = feeRuleBody(companyCode, form);
      if (ruleModal.id != null) await api.put(`/fees/structures/${ruleModal.id}`, body);
      else await api.post("/fees/structures", body);
      toast.success(ruleModal.id != null ? `Updated “${body.feeName}”` : `Created “${body.feeName}”`);
      setRuleModal(null);
      refresh();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not save the fee rule."));
    } finally {
      setSaving(false);
    }
  };

  const saveDiscount = async (form: DiscountForm) => {
    if (!discountModal || saving) return;
    setSaving(true);
    try {
      const body = discountBody(companyCode, form);
      if (discountModal.id != null) await api.put(`/fees/discounts/${discountModal.id}`, body);
      else await api.post("/fees/discounts", body);
      toast.success(discountModal.id != null ? `Updated ${body.discountCode}` : `Created ${body.discountCode}`);
      setDiscountModal(null);
      refresh();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not save the discount."));
    } finally {
      setSaving(false);
    }
  };

  // DELETE deactivates the rule on the backend; existing proposals keep their saved amounts.
  const deactivate = async () => {
    if (!deactivating || saving) return;
    setSaving(true);
    try {
      if (deactivating.kind === "rule") await api.delete(`/fees/structures/${deactivating.item.id}`);
      else await api.delete(`/fees/discounts/${deactivating.item.id}`);
      toast.success("Deactivated");
      setDeactivating(null);
      refresh();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not deactivate."));
    } finally {
      setSaving(false);
    }
  };

  const newRule = (isAdditionalService: boolean, gradeOrProgram = "") =>
    setRuleModal({
      id: null,
      initial: {
        ...EMPTY_FEE_RULE,
        branchCode,
        isAdditionalService,
        gradeOrProgram: gradeOrProgram || (isAdditionalService ? ALL_PROGRAMS : ""),
        serviceType: isAdditionalService ? "ACTIVITY_FEE" : "TUITION",
      },
    });

  const ruleActions = (r: ApiFeeRule) =>
    canManage && (
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="ghost" aria-label={`Edit ${r.feeName ?? "fee rule"}`} onClick={() => setRuleModal({ id: r.id, initial: feeRuleForm(r) })}>
          <Pencil className="h-4 w-4" />
        </Button>
        {r.active !== false && (
          <Button size="sm" variant="ghost" aria-label={`Deactivate ${r.feeName ?? "fee rule"}`} onClick={() => setDeactivating({ kind: "rule", item: r })}>
            <X className="h-4 w-4 text-danger" />
          </Button>
        )}
      </div>
    );

  const statusBadges = (r: { active?: boolean | null; branchCode?: string | null; isTaxable?: boolean | null }) => (
    <span className="inline-flex flex-wrap gap-1">
      {r.active === false && <Badge variant="secondary">Inactive</Badge>}
      {r.branchCode ? <Badge variant="info">{branchLabel(branches, r.branchCode)}</Badge> : <Badge variant="secondary">All branches</Badge>}
      {r.isTaxable && <Badge variant="warning">Taxable</Badge>}
    </span>
  );

  const loadState = (query: { isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown }, what: string) =>
    !enabled || query.isPending ? (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading {what}…
      </div>
    ) : query.isError ? (
      <div className="rounded-2xl bg-surface p-8 text-center shadow-card">
        <p className="text-sm font-medium text-danger">{apiErrorMessage(query.error, `Could not load ${what}.`)}</p>
        <Button variant="outline" className="mt-4" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </div>
    ) : null;

  return (
    <>
      <Card className="mb-6">
        <CardContent className="p-5">
          <h2 className="mb-1 font-semibold text-heading">How fees work</h2>
          <p className="mb-4 text-xs text-muted">
            Staff never type amounts — every admission is priced by the server from the rules below.
          </p>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {FLOW.map((step, i) => {
              const Icon = step.icon;
              const body = (
                <>
                  <span className="flex items-center gap-2 text-sm font-semibold text-heading">
                    <Icon className="h-4 w-4 shrink-0 text-brand-500" />
                    {step.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-wide text-brand-700">{step.who}</span>
                  <span className="mt-1 block text-xs text-muted">{step.text}</span>
                </>
              );
              return (
                <li key={step.title} className="relative">
                  {step.href ? (
                    <Link href={step.href} className="block h-full rounded-xl border border-[#F1F3F5] p-3 hover:border-brand-300 hover:bg-brand-50/40">
                      {body}
                    </Link>
                  ) : (
                    <div className={cn("h-full rounded-xl border p-3", i === 0 ? "border-brand-300 bg-brand-50/60" : "border-[#F1F3F5]")}>{body}</div>
                  )}
                  {i < FLOW.length - 1 && (
                    <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 text-muted lg:block" aria-hidden />
                  )}
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      {!companyLoading && !resolved && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Your school could not be identified — sign in again before changing fee rules.</span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger className="w-[260px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={COMPANY_WIDE}>Company-wide prices{companyName ? ` · ${companyName}` : ""}</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.code} value={b.code}>
                {b.name} (with branch prices)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm text-muted">
          <Switch checked={showInactive} onCheckedChange={setShowInactive} />
          Show inactive
        </label>
        <Button variant="outline" size="sm" onClick={refresh} disabled={rulesQuery.isFetching}>
          <RefreshCw className={rulesQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refresh
        </Button>
        {!canManage && <span className="text-xs text-muted">View only — fee setup needs the Fee manage permission.</span>}
      </div>

      <Tabs defaultValue="programs">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="programs">Program fees</TabsTrigger>
          <TabsTrigger value="services">Optional services ({addOns.length})</TabsTrigger>
          <TabsTrigger value="discounts">Discounts ({discounts.length})</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="programs">
          {loadState(rulesQuery, "fee rules") ?? (
            <div className="space-y-4">
              {canManage && (
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => newRule(false)}>
                    <Plus className="h-4 w-4" />
                    Add program fee
                  </Button>
                </div>
              )}
              {programGroups.length === 0 ? (
                <Card>
                  <CardContent className="p-10 text-center text-sm text-muted">
                    No program fees yet. Add a monthly tuition and a one-time admission fee for each program — staff cannot
                    propose fees for a program without them.
                  </CardContent>
                </Card>
              ) : (
                programGroups.map(({ program, list }) => {
                  const totals = summaryQuery.data?.programs?.find((p) => sameProgram(p.gradeOrProgram, program));
                  const isAll = program.toUpperCase() === ALL_PROGRAMS;
                  return (
                    <Card key={program}>
                      <CardContent className="p-5">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-heading">{isAll ? "All programs" : program}</h3>
                            {isAll ? (
                              <p className="text-xs text-muted">Added to every program (e.g. admission or annual charges)</p>
                            ) : (
                              totals && (
                                <p className="text-xs text-muted">
                                  Server total: {formatCurrency(totals.totalMonthlyAmount ?? 0)}/mo ·{" "}
                                  {formatCurrency(totals.totalOneTimeAmount ?? 0)} one-time
                                </p>
                              )
                            )}
                          </div>
                          {canManage && (
                            <Button size="sm" variant="outline" onClick={() => newRule(false, program)}>
                              <Plus className="h-4 w-4" />
                              Add fee
                            </Button>
                          )}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="text-xs uppercase tracking-wide text-muted">
                              <tr>
                                <th className="py-2 pr-4 font-semibold">Fee</th>
                                <th className="py-2 pr-4 font-semibold">Type</th>
                                <th className="py-2 pr-4 font-semibold">Cycle</th>
                                <th className="py-2 pr-4 text-right font-semibold">Amount</th>
                                <th className="py-2 pr-4 font-semibold">Scope</th>
                                <th className="py-2" />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F3F5]">
                              {list.map((r) => (
                                <tr key={r.id} className={r.active === false ? "opacity-60" : undefined}>
                                  <td className="py-2 pr-4 font-medium text-heading">{r.feeName || "—"}</td>
                                  <td className="py-2 pr-4">{serviceTypeLabel(r.serviceType)}</td>
                                  <td className="py-2 pr-4">{billingCycleLabel(r.billingCycle)}</td>
                                  <td className="py-2 pr-4 text-right font-medium">{formatCurrency(r.baseAmount ?? 0)}</td>
                                  <td className="py-2 pr-4">{statusBadges(r)}</td>
                                  <td className="py-2">{ruleActions(r)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="services">
          {loadState(rulesQuery, "services") ?? (
            <Card>
              <CardContent className="p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted">
                    Optional services (Quran class, transport, extended daycare…) staff can tick when proposing fees and
                    subscribe enrolled students to.
                  </p>
                  {canManage && (
                    <Button size="sm" onClick={() => newRule(true)}>
                      <Plus className="h-4 w-4" />
                      Add service
                    </Button>
                  )}
                </div>
                {addOns.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted">No optional services yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs uppercase tracking-wide text-muted">
                        <tr>
                          <th className="py-2 pr-4 font-semibold">Service</th>
                          <th className="py-2 pr-4 font-semibold">Program</th>
                          <th className="py-2 pr-4 font-semibold">Type</th>
                          <th className="py-2 pr-4 text-right font-semibold">Price</th>
                          <th className="py-2 pr-4 font-semibold">Scope</th>
                          <th className="py-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F3F5]">
                        {addOns.map((r) => (
                          <tr key={r.id} className={r.active === false ? "opacity-60" : undefined}>
                            <td className="py-2 pr-4 font-medium text-heading">{r.feeName || "—"}</td>
                            <td className="py-2 pr-4">
                              {!r.gradeOrProgram || r.gradeOrProgram.toUpperCase() === ALL_PROGRAMS ? "All programs" : r.gradeOrProgram}
                            </td>
                            <td className="py-2 pr-4">{serviceTypeLabel(r.serviceType)}</td>
                            <td className="py-2 pr-4 text-right font-medium">
                              {formatCurrency(r.baseAmount ?? 0)}
                              <span className="text-xs text-muted">{CYCLE_SUFFIX[r.billingCycle ?? ""] ?? ""}</span>
                            </td>
                            <td className="py-2 pr-4">{statusBadges(r)}</td>
                            <td className="py-2">{ruleActions(r)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="discounts">
          {loadState(discountsQuery, "discounts") ?? (
            <Card>
              <CardContent className="p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted">
                    Discount templates staff apply by code. “Tuition only” discounts reduce recurring tuition; “whole gross
                    amount” discounts apply to everything.
                  </p>
                  {canManage && (
                    <Button size="sm" onClick={() => setDiscountModal({ id: null, initial: { ...EMPTY_DISCOUNT, branchCode } })}>
                      <BadgePercent className="h-4 w-4" />
                      Add discount
                    </Button>
                  )}
                </div>
                {discounts.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted">No discounts yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs uppercase tracking-wide text-muted">
                        <tr>
                          <th className="py-2 pr-4 font-semibold">Discount</th>
                          <th className="py-2 pr-4 font-semibold">Code</th>
                          <th className="py-2 pr-4 text-right font-semibold">Value</th>
                          <th className="py-2 pr-4 font-semibold">Applies to</th>
                          <th className="py-2 pr-4 font-semibold">Scope</th>
                          <th className="py-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F3F5]">
                        {discounts
                          .filter((d) => showInactive || d.active !== false)
                          .map((d) => (
                            <tr key={d.id} className={d.active === false ? "opacity-60" : undefined}>
                              <td className="py-2 pr-4 font-medium text-heading">{d.name || "—"}</td>
                              <td className="py-2 pr-4 font-mono text-xs">{d.discountCode}</td>
                              <td className="py-2 pr-4 text-right font-medium">{discountValueLabel(d, formatCurrency)}</td>
                              <td className="py-2 pr-4 text-xs">
                                {!d.applicableServiceType || d.applicableServiceType.toUpperCase() === ALL_PROGRAMS
                                  ? "Whole amount"
                                  : serviceTypeLabel(d.applicableServiceType)}
                                {" · "}
                                {!d.applicableGrade || d.applicableGrade.toUpperCase() === ALL_PROGRAMS ? "all programs" : d.applicableGrade}
                              </td>
                              <td className="py-2 pr-4">{statusBadges(d)}</td>
                              <td className="py-2">
                                {canManage && (
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      aria-label={`Edit ${d.discountCode}`}
                                      onClick={() => setDiscountModal({ id: d.id, initial: discountForm(d) })}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    {d.active !== false && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        aria-label={`Deactivate ${d.discountCode}`}
                                        onClick={() => setDeactivating({ kind: "discount", item: d })}
                                      >
                                        <X className="h-4 w-4 text-danger" />
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calculator">
          <FeeCalculatorPanel companyCode={companyCode} branchCode={branchCode} programs={programNames} discounts={discounts} />
        </TabsContent>
      </Tabs>

      <FeeRuleModal
        open={!!ruleModal}
        editing={ruleModal?.id != null}
        initial={ruleModal?.initial ?? EMPTY_FEE_RULE}
        branches={branches}
        programs={programNames}
        saving={saving}
        onCancel={() => setRuleModal(null)}
        onSave={(f) => void saveRule(f)}
      />
      <DiscountRuleModal
        open={!!discountModal}
        editing={discountModal?.id != null}
        initial={discountModal?.initial ?? EMPTY_DISCOUNT}
        branches={branches}
        programs={programNames}
        saving={saving}
        onCancel={() => setDiscountModal(null)}
        onSave={(f) => void saveDiscount(f)}
      />

      <ModalPortal open={!!deactivating} onClose={saving ? () => {} : () => setDeactivating(null)} closeOnBackdrop={!saving}>
        <div className="space-y-3 px-6 py-5">
          <h2 className="font-heading text-lg font-bold text-heading">
            Deactivate{" "}
            {deactivating?.kind === "rule" ? `“${deactivating.item.feeName ?? "fee rule"}”` : deactivating?.item.discountCode}?
          </h2>
          <p className="text-sm text-muted">
            Staff will no longer be able to {deactivating?.kind === "rule" ? "price new proposals with it" : "apply this code"}.
            Fees already proposed or locked keep their saved amounts.
          </p>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
          <Button type="button" variant="outline" disabled={saving} onClick={() => setDeactivating(null)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={saving} onClick={() => void deactivate()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Deactivate
          </Button>
        </div>
      </ModalPortal>
    </>
  );
}
