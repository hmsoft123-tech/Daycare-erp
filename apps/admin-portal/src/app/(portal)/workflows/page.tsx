import { PageHeader } from "@/components/layout/PageHeader";
import { WorkflowBoards } from "@/components/reports/WorkflowBoards";

export default function WorkflowsPage() {
  return (
    <>
      <PageHeader
        title="Core Workflows"
        subtitle="Billing · Students · Inventory status boards (SDLC-aligned)"
      />
      <WorkflowBoards />
    </>
  );
}
