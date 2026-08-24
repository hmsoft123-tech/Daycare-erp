import { PageHeader } from "@/components/layout/PageHeader";
import { IncidentsHub } from "@/components/incidents/IncidentsHub";

export default function IncidentsPage() {
  return (
    <>
      <PageHeader
        title="ABC Incident Reports"
        subtitle="Antecedent · Behavior · Consequence · parent notify"
      />
      <IncidentsHub />
    </>
  );
}
