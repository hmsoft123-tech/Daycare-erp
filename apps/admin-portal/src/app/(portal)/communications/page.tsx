import { PageHeader } from "@/components/layout/PageHeader";
import { CommunicationsHub } from "@/components/comms/CommunicationsHub";

export default function CommunicationsPage() {
  return (
    <>
      <PageHeader
        title="Communications"
        subtitle="Parent inbox · PTM slots · push notifications"
      />
      <CommunicationsHub />
    </>
  );
}
