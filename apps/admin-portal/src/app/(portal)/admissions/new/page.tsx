import { PageHeader } from "@/components/layout/PageHeader";
import { EnrollmentWizard } from "@/components/admissions/EnrollmentWizard";

export default function NewEnrollmentPage() {
  return (
    <>
      <PageHeader title="Enrollment Wizard" subtitle="Complete all steps to enroll a new student" />
      <EnrollmentWizard />
    </>
  );
}
