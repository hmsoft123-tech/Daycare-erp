import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getStaffById } from "@/lib/mock-service";
import { branches } from "@/data/branches";
import { formatDate, getInitials } from "@/lib/utils";

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

  const branch = branches.find((b) => b.id === member.branchId);

  return (
    <>
      <PageHeader title={member.name} subtitle={roleLabels[member.role]} />
      <Card className="max-w-2xl">
        <CardContent className="flex gap-6 p-6">
          <Avatar className="h-20 w-20">
            {member.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback className="text-xl">{getInitials(member.name)}</AvatarFallback>
            )}
          </Avatar>
          <div className="space-y-3 text-sm">
            <Badge variant="info">{roleLabels[member.role]}</Badge>
            <p><span className="text-gray-500">Employee ID:</span> {member.employeeId}</p>
            <p><span className="text-gray-500">Branch:</span> {branch?.name}</p>
            <p><span className="text-gray-500">Joined:</span> {formatDate(member.joinDate)}</p>
            <p><span className="text-gray-500">Phone:</span> {member.phone}</p>
            <p><span className="text-gray-500">Email:</span> {member.email}</p>
            {member.specializations && (
              <p><span className="text-gray-500">Specializations:</span> {member.specializations.join(", ")}</p>
            )}
            <Button variant="outline" asChild>
              <Link href="/hr/staff">← Back to directory</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
