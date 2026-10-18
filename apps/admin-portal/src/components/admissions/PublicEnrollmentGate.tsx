"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicEnrollmentClient } from "@/components/admissions/PublicEnrollmentClient";
import { publicApi } from "@/lib/api";
import type { ApiTokenValidation } from "@/lib/enrollment-api";
import type { EnrollmentInvite } from "@/lib/enrollment-invite-store";

/**
 * Parent enrollment link issued by the backend: checks the token with
 * `GET /public/enrollment/validate-token/{token}` and opens the wizard prefilled.
 */
export function PublicEnrollmentGate({ token }: { token: string }) {
  const [state, setState] = useState<
    { status: "loading" } | { status: "invalid" } | { status: "ok"; invite: EnrollmentInvite }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    publicApi
      .get<ApiTokenValidation>(`/enrollment/validate-token/${encodeURIComponent(token)}`)
      .then((res) => {
        if (cancelled) return;
        if (!res?.valid) return setState({ status: "invalid" });
        setState({
          status: "ok",
          invite: {
            token,
            tenantSlug: "",
            email: res.parentEmail ?? "",
            parentName: res.parentName ?? "",
            status: "pending",
            createdAt: new Date().toISOString(),
            expiresAt: res.expiresAt ?? new Date().toISOString(),
            admissionId: res.inquiryId != null ? String(res.inquiryId) : undefined,
            prefill: {
              childFullName: res.childName ?? undefined,
              dob: res.childDob ?? undefined,
              fatherName: res.parentName ?? undefined,
              fatherEmail: res.parentEmail ?? undefined,
              fatherPhone: res.parentPhone ?? undefined,
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "invalid" });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.status === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking your enrollment link…
      </div>
    );
  }

  if (state.status === "invalid") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-soft-red text-danger">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-6 font-heading text-2xl font-bold text-heading">Link not available</h1>
        <p className="mt-3 text-sm text-muted">
          This enrollment link is invalid, expired or already used. Contact your school for a new
          invite.
        </p>
        <Button asChild className="mt-8" variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    );
  }

  return <PublicEnrollmentClient invite={state.invite} backend />;
}
