import { Suspense } from "react";
import { EnrollThanksClient } from "./EnrollThanksClient";

export default function EnrollThanksPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-24 text-center text-muted">Loading...</div>
      }
    >
      <EnrollThanksClient />
    </Suspense>
  );
}
