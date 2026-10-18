import { AdmissionDetail } from "@/components/admissions/AdmissionDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdmissionDetailPage({ params }: Props) {
  const { id } = await params;
  return <AdmissionDetail id={id} />;
}
