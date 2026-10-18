import { StaffInquiryDetail } from "@/components/hr/staff-inquiry/StaffInquiryDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StaffInquiryDetailPage({ params }: Props) {
  const { id } = await params;
  return <StaffInquiryDetail id={id} />;
}
