"use client";

import { Printer, X, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalPortal } from "@/components/ui/modal-portal";
import { IdCardVisual } from "@/components/id-cards/IdCardVisual";
import type { PortalIdCard } from "@/types";

type Props = {
  open: boolean;
  card: PortalIdCard | null;
  onClose: () => void;
  title?: string;
  subtitle?: string;
};

export function IdCardPreviewModal({ open, card, onClose, title, subtitle }: Props) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <ModalPortal open={open && !!card} onClose={onClose} maxWidth="max-w-xl">
      <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5 print:hidden">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <CreditCard className="h-5 w-5 text-brand-500" />
            {title ?? (card?.kind === "staff" ? "Staff ID Card" : "Student ID Card")}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {subtitle ??
              "Generated when the record was saved to the portal. Print or save for campus use."}
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 py-6">
        {card && (
          <>
            <div className="print:block">
              <IdCardVisual card={card} size="lg" />
            </div>
            <p className="mt-4 text-center text-xs text-muted print:hidden">
              Card no. <span className="font-mono font-semibold text-heading">{card.cardNumber}</span>
            </p>
          </>
        )}
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4 print:hidden">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button type="button" onClick={handlePrint}>
          <Printer className="h-4 w-4" />
          Print ID Card
        </Button>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .id-card-print, .id-card-print * { visibility: visible !important; }
          .id-card-print {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </ModalPortal>
  );
}
