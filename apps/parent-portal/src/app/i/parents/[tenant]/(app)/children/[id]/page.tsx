import { Suspense } from "react";
import { ChildProfileClient } from "@/components/ChildProfileClient";

type Props = { params: Promise<{ id: string }> };

export default async function ChildProfilePage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">Loading profile…</div>}>
      <ChildProfileClient childId={id} />
    </Suspense>
  );
}
