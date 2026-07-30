import { PageHeader } from "@/components/layout/PageHeader";
import { AdminHiringWizardClient } from "@/components/hr/employee-file/AdminHiringWizardClient";

export default function HiringWizardPage() {
  return (
    <>
      <PageHeader
        title="Hiring Wizard"
        subtitle="Manually complete initial hire + employee file in the admin panel"
      />
      <AdminHiringWizardClient />
    </>
  );
}
