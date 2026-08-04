import { notFound } from "next/navigation";
import { RequisitionDetailClient } from "@/components/inventory/RequisitionDetailClient";
import { getPurchaseRequisitionById } from "@/lib/mock-service";
import { branches } from "@/data/branches";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RequisitionDetailPage({ params }: Props) {
  const { id } = await params;
  const pr = await getPurchaseRequisitionById(id);
  if (!pr) notFound();
  const branch = branches.find((b) => b.id === pr.branchId);

  return <RequisitionDetailClient initial={pr} branchName={branch?.name} />;
}
