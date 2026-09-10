import { PageHeader } from "@/components/layout/PageHeader";
import { MaintenanceBoard } from "@/components/maintenance/MaintenanceBoard";

export default function MaintenancePage() {
  return (
    <>
      <PageHeader
        title="Maintenance"
        subtitle="AC, CCTV, plumbing, IT and building service history by branch and vendor"
      />
      <MaintenanceBoard />
    </>
  );
}
