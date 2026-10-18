"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StaffInquiryCard } from "@/types";
import type { ApiStaffInquiryCard } from "@/lib/staff-inquiries-api";
import type { ApiPipelineStage } from "@/lib/admissions-api";

/**
 * Offer / hire progress for API candidates. The backend has no offer or hire
 * endpoint yet, so this is kept in the browser and overlaid on the board. An
 * entry is ignored once the backend stage moves on (e.g. HR re-schedules an interview).
 */
type HiringEntry = {
  /** Backend stage when the offer was saved */
  apiStage: ApiPipelineStage;
  patch: Partial<StaffInquiryCard>;
};

type StaffHiringState = {
  /** tenantId → inquiry id → entry */
  byTenant: Record<string, Record<string, HiringEntry>>;
  save: (
    tenantId: string,
    card: Pick<ApiStaffInquiryCard, "id" | "apiStage">,
    patch: Partial<StaffInquiryCard>
  ) => void;
};

export const useStaffHiringStore = create<StaffHiringState>()(
  persist(
    (set) => ({
      byTenant: {},
      save: (tenantId, card, patch) =>
        set((s) => {
          const tenant = s.byTenant[tenantId] ?? {};
          const prev = tenant[card.id];
          const keep = prev && prev.apiStage === card.apiStage ? prev.patch : {};
          return {
            byTenant: {
              ...s.byTenant,
              [tenantId]: {
                ...tenant,
                [card.id]: { apiStage: card.apiStage, patch: { ...keep, ...patch } },
              },
            },
          };
        }),
    }),
    { name: "kp-staff-hiring" }
  )
);

export function applyHiringOverlay(
  cards: ApiStaffInquiryCard[],
  entries: Record<string, HiringEntry> | undefined
): ApiStaffInquiryCard[] {
  if (!entries) return cards;
  return cards.map((card) => {
    const entry = entries[card.id];
    return entry && entry.apiStage === card.apiStage ? { ...card, ...entry.patch } : card;
  });
}
