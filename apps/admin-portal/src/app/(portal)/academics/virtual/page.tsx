import { PageHeader } from "@/components/layout/PageHeader";
import { VirtualClassroomHub } from "@/components/academics/VirtualClassroomHub";

export default function VirtualClassroomPage() {
  return (
    <>
      <PageHeader
        title="Virtual Classroom"
        subtitle="Google Meet · Zoom · Teams sessions for parents"
      />
      <VirtualClassroomHub />
    </>
  );
}
