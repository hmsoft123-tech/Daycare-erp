import { Suspense } from "react";
import { InquiryThanksClient } from "./InquiryThanksClient";

export default function InquiryThanksPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-24 text-center text-muted">Loading...</div>
      }
    >
      <InquiryThanksClient />
    </Suspense>
  );
}
