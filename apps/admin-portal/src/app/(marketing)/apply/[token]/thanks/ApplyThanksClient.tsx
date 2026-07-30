"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export function ApplyThanksClient({ name }: { name: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-soft-green text-brand-700">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <h1 className="mt-6 font-heading text-2xl font-bold text-heading">Thank you, {name}</h1>
      <p className="mt-3 text-sm text-muted">
        Your hiring documents were submitted. HR will complete the remaining employee-file annexes
        and contact you about joining and induction.
      </p>
      <Button asChild className="mt-8" variant="outline">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
