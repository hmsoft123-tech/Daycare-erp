import { StaffInquiryPageClient } from "@/components/hr/staff-inquiry/StaffInquiryPageClient";
import { getStaffInquiries } from "@/lib/mock-service";

export default async function StaffInquiriesPage() {
  const inquiries = await getStaffInquiries();
  return <StaffInquiryPageClient initial={inquiries} />;
}
