"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type BillingState = {
  paidInvoiceIds: string[];
  unlockedChildIds: string[];
  markInvoicePaid: (invoiceId: string, childId?: string) => void;
  isChildUnlocked: (childId: string, enrollmentStatus: string) => boolean;
};

export const useBillingStore = create<BillingState>()(
  persist(
    (set, get) => ({
      paidInvoiceIds: [],
      unlockedChildIds: [],

      markInvoicePaid: (invoiceId, childId) =>
        set((s) => ({
          paidInvoiceIds: s.paidInvoiceIds.includes(invoiceId)
            ? s.paidInvoiceIds
            : [...s.paidInvoiceIds, invoiceId],
          unlockedChildIds:
            childId && !s.unlockedChildIds.includes(childId)
              ? [...s.unlockedChildIds, childId]
              : s.unlockedChildIds,
        })),

      isChildUnlocked: (childId, enrollmentStatus) => {
        if (enrollmentStatus !== "pending_first_payment") return true;
        return get().unlockedChildIds.includes(childId);
      },
    }),
    { name: "kp-parent-billing" }
  )
);
