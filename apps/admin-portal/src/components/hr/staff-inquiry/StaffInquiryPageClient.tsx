"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { StaffInquiryBoard } from "@/components/hr/staff-inquiry/StaffInquiryBoard";
import { AddStaffInquiryModal } from "@/components/hr/staff-inquiry/AddStaffInquiryModal";
import { PublicInquiryLinkBanner } from "@/components/admissions/PublicInquiryLinkBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useApiClient } from "@/lib/api";
import { apiErrorMessage, type ApiKanbanBoard } from "@/lib/admissions-api";
import { interviewBody, kanbanToStaffCards, roleLabel } from "@/lib/staff-inquiries-api";
import { applyHiringOverlay, useStaffHiringStore } from "@/lib/staff-hiring-store";
import { queryKeys } from "@/lib/query-client";
import { useTenantStore } from "@/lib/tenant-store";
import type { StaffInquiryCard } from "@/types";
import { useAccess } from "@/components/security/Can";

/**
 * Staff hiring pipeline backed by the KinderPilot API. Candidates are the
 * employment-application inquiries on `GET /admissions/kanban`; interviews and
 * the talent pool persist through the admissions endpoints, offer / hire stay local.
 */
export function StaffInquiryPageClient() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const tenantId = useTenantStore((s) => s.tenantId) ?? "";
  const queryKey = queryKeys.admissions(tenantId, null);
  const [addOpen, setAddOpen] = useState(false);
  const access = useAccess();

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () => api.get<ApiKanbanBoard>("/admissions/kanban"),
  });

  const hiring = useStaffHiringStore((s) => s.byTenant[tenantId]);
  const saveHiring = useStaffHiringStore((s) => s.save);
  const apiCards = useMemo(() => (data ? kanbanToStaffCards(data) : []), [data]);
  const items = useMemo(() => applyHiringOverlay(apiCards, hiring), [apiCards, hiring]);

  /** Runs one write, then reloads so the board shows what the backend stored. */
  const run = async (call: () => Promise<unknown>, success: string) => {
    try {
      await call();
      toast.success(success);
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not update the candidate."));
    } finally {
      void queryClient.invalidateQueries({ queryKey });
    }
  };

  const denied = async (action: string) => {
    toast.error(`Your role cannot ${action}`);
    void queryClient.invalidateQueries({ queryKey }); // undo the optimistic move
  };

  const onOfferSaved = (card: StaffInquiryCard, patch: Partial<StaffInquiryCard>) => {
    const apiCard = apiCards.find((c) => c.id === card.id);
    if (apiCard) saveHiring(tenantId, apiCard, patch);
  };

  return (
    <>
      <PageHeader
        title="Staff Inquiries"
        subtitle="Hiring pipeline — inquiry → interview → offer → hired"
      >
        <Button type="button" onClick={() => setAddOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Add Inquiry
        </Button>
      </PageHeader>
      <PublicInquiryLinkBanner
        title="Public employment inquiry link"
        description="Candidates open this link, choose Employment, and land in Staff Inquiries — same flow as admissions."
        inquiryType="employment"
      />
      <div className="mb-4 rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-brand-900">
        <p className="font-semibold">Secure hire application (employee file)</p>
        <p className="mt-1 text-xs text-brand-800/90">
          From Offer / Hire, create an apply link — candidates only see hiring-time documents.
          Interviews and the talent pool are saved to the server; offer and hire details are kept in
          this browser until the API adds a hiring step.
        </p>
      </div>

      {isPending ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading candidates…
        </div>
      ) : isError ? (
        <div className="rounded-2xl bg-surface p-8 text-center shadow-card">
          <p className="text-sm font-medium text-danger">
            {apiErrorMessage(error, "Could not load staff inquiries.")}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          {isFetching && (
            <p className="mb-2 flex items-center gap-2 text-xs text-muted">
              <Loader2 className="h-3 w-3 animate-spin" />
              Syncing…
            </p>
          )}
          <StaffInquiryBoard
            inquiries={items}
            onScheduleInterview={(card, values) =>
              !access("admissions.update")
                ? denied("schedule interviews")
                : run(
                () => api.post(`/admissions/inquiries/${card.id}/schedule-tour`, interviewBody(values)),
                "Interview scheduled"
              )
            }
            onTalentPool={(card) =>
              !access("admissions.waitlist")
                ? denied("move candidates to the talent pool")
                : run(
                () =>
                  api.post("/admissions/waitlist", {
                    inquiryId: Number(card.id),
                    desiredClassroomOrGrade:
                      apiCards.find((c) => c.id === card.id)?.position || roleLabel(card.role),
                    priorityReason: "Talent pool",
                  }),
                "Moved to talent pool"
              )
            }
            onOfferSaved={onOfferSaved}
          />
        </>
      )}

      <AddStaffInquiryModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => void queryClient.invalidateQueries({ queryKey })}
      />
    </>
  );
}
