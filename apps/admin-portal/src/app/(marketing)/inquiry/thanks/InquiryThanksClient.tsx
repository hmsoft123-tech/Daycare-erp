"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, Calendar, CreditCard, ArrowLeft, Briefcase } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  admission: "admission",
  employment: "employment",
  tour: "tour",
  general: "general",
};

export function InquiryThanksClient() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") ?? "general";
  const name = searchParams.get("name") ?? "there";
  const typeLabel = TYPE_LABELS[type] ?? "inquiry";
  const isAdmission = type === "admission" || type === "tour";
  const isEmployment = type === "employment";

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-heading text-3xl font-bold text-heading">Thank you, {name}!</h1>
        <p className="mt-3 text-muted">
          Your {typeLabel} inquiry has been received. Here&apos;s what happens next:
        </p>
      </div>

      <ol className="mt-10 space-y-4">
        <li className="flex gap-4 rounded-xl border border-border bg-surface p-4 shadow-card">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-heading">
              {isEmployment ? "Added to Staff Inquiries pipeline" : "Inquiry added to CRM pipeline"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {isEmployment
                ? "Our HR team has received your application and will review it in the hiring pipeline."
                : "Our admissions team has received your submission and will review it shortly."}
            </p>
          </div>
        </li>
        {isEmployment ? (
          <>
            <li className="flex gap-4 rounded-xl border border-border bg-surface p-4 shadow-card">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-heading">HR follow-up by email or phone</p>
                <p className="mt-1 text-sm text-muted">
                  We&apos;ll contact you to confirm your interest and share next steps for the role you applied for.
                </p>
              </div>
            </li>
            <li className="flex gap-4 rounded-xl border border-border bg-surface p-4 shadow-card">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-heading">Interview scheduling</p>
                <p className="mt-1 text-sm text-muted">
                  Shortlisted candidates are moved to Interview Scheduled — you&apos;ll get date, time, and location details.
                </p>
              </div>
            </li>
            <li className="flex gap-4 rounded-xl border border-brand-200 bg-brand-50/50 p-4 shadow-card">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-heading">Offer &amp; hire</p>
                <p className="mt-1 text-sm text-muted">
                  After a successful interview, an offer is issued. Once accepted, you&apos;re marked Hired and added to the staff directory.
                </p>
              </div>
            </li>
          </>
        ) : (
          <>
            <li className="flex gap-4 rounded-xl border border-border bg-surface p-4 shadow-card">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-heading">Detailed enrollment form by email</p>
                <p className="mt-1 text-sm text-muted">
                  Check your inbox — we&apos;ll send a secure link to complete the full enrollment / application form with medical info, documents, and consents.
                </p>
              </div>
            </li>
            {isAdmission && (
              <li className="flex gap-4 rounded-xl border border-border bg-surface p-4 shadow-card">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-heading">Tour &amp; enrollment follow-up</p>
                  <p className="mt-1 text-sm text-muted">
                    We may schedule a campus tour, then invite you to pay the first invoice through the Parent Portal to secure your spot.
                  </p>
                </div>
              </li>
            )}
            {isAdmission && (
              <li className="flex gap-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-card">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-heading">First payment via Parent Portal</p>
                  <p className="mt-1 text-sm text-muted">
                    Once enrolled, you&apos;ll receive Parent Portal access. Your child&apos;s spot is confirmed after the first invoice is paid.
                  </p>
                </div>
              </li>
            )}
          </>
        )}
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
