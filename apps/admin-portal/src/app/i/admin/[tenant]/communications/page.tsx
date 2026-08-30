import { PageHeader } from "@/components/layout/PageHeader";
import { CommunicationsHub } from "@/components/comms/CommunicationsHub";

export default function CommunicationsPage() {
  return (
    <>
      <PageHeader
        title="Communications"
        subtitle="Messages · Announcements · Newsletters · PTM — Parents & Staff"
      />
      <CommunicationsHub />
    </>
  );
}
