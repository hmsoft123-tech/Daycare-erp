"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ModalPortalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Extra classes on the dialog panel */
  className?: string;
  maxWidth?: string;
  /** Click backdrop to close (default true) */
  closeOnBackdrop?: boolean;
};

/**
 * Viewport-centered modal rendered via portal to document.body.
 * Avoids broken `fixed` positioning when ancestors use transform (e.g. page enter animation).
 */
export function ModalPortal({
  open,
  onClose,
  children,
  className,
  maxWidth = "max-w-lg",
  closeOnBackdrop = true,
}: ModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#161C24]/50 backdrop-blur-[2px]"
            onClick={closeOnBackdrop ? onClose : undefined}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "relative z-10 flex max-h-[min(90dvh,calc(100vh-2rem))] w-full flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_24px_48px_-12px_rgba(145,158,171,0.28)]",
              maxWidth,
              className
            )}
            role="dialog"
            aria-modal="true"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
