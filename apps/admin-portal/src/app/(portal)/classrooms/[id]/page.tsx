import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClassroomDetailClient } from "@/components/classrooms/ClassroomDetailClient";
import { branches } from "@/data/branches";
import {
  getClassById,
  getClassroomActivities,
  getStaff,
  getStudents,
} from "@/lib/mock-service";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClassroomDetailPage({ params }: Props) {
  const { id } = await params;
  const room = await getClassById(id);
  if (!room) notFound();

  const [students, staff, activities] = await Promise.all([
    getStudents(),
    getStaff(),
    getClassroomActivities({ classId: id }),
  ]);
  const branch = branches.find((b) => b.id === room.branchId);

  return (
    <>
      <PageHeader title={room.name} subtitle={branch?.name ?? room.branchId} />
      <ClassroomDetailClient
        room={room}
        students={students}
        staff={staff}
        activities={activities}
        branchName={branch?.name}
      />
    </>
  );
}
