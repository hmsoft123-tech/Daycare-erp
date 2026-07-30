import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { StaffDetailClient } from "@/components/hr/StaffDetailClient";
import { getStaffById } from "@/lib/mock-service";

interface Props {
  params: Promise<{ id: string }>;
}

const roleLabels = {
  admin: "Administrator",
  teacher: "Teacher",
  therapist: "Therapist",
  accountant: "Accountant",
  support: "Support Staff",
  executive: "Executive",
} as const;

export default async function StaffDetailPage({ params }: Props) {
  const { id } = await params;
  const member = await getStaffById(id);
  if (!member) notFound();

  return (
    <>
      <PageHeader title={member.name} subtitle={roleLabels[member.role]} />
      <StaffDetailClient member={member} />
    </>
  );
}
