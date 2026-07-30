"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CreditCard, Mail, ArrowLeft } from "lucide-react";

export function EnrollThanksClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const name = searchParams.get("name") ?? "there";
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-heading text-3xl font-bold text-heading">Thank you, {name}!</h1>
        <p className="mt-3 text-muted">
          Your enrollment form was submitted securely. This invite link is now marked complete.
        </p>
      </div>

      <ol className="mt-10 space-y-4">
        <li className="flex gap-4 rounded-xl border border-border bg-surface p-4 shadow-card">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-heading">Form received by the school</p>
            <p className="mt-1 text-sm text-muted">
              Admissions will review documents and signature. Token{" "}
              <code className="rounded bg-bg px-1 text-xs">{token.slice(0, 12)}…</code> cannot be reused.
            </p>
          </div>
        </li>
        <li className="flex gap-4 rounded-xl border border-border bg-surface p-4 shadow-card">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-heading">Confirmation by email</p>
            <p className="mt-1 text-sm text-muted">
              You&apos;ll receive next steps for payment and Parent Portal access once the school confirms.
            </p>
          </div>
        </li>
        <li className="flex gap-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-card">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-heading">First payment &amp; ID card</p>
            <p className="mt-1 text-sm text-muted">
              After the first invoice is paid in the Parent Portal, the school issues the student ID card.
            </p>
          </div>
        </li>
      </ol>

      <div className="mt-10 text-center">
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  );
}
