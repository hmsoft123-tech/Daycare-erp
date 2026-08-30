import { PageHeader } from "@/components/layout/PageHeader";
import { WorkflowBoards } from "@/components/reports/WorkflowBoards";

export default function WorkflowsPage() {
  return (
    <>
      <PageHeader
        title="Core Workflows"
        subtitle="All 7 SDLC chains — Admission · Daily Care · Academics · Billing · Purchasing · Maintenance · HR"
      />
      <WorkflowBoards />
    </>
  );
}
