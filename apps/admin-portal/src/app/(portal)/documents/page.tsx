import { PageHeader } from "@/components/layout/PageHeader";
import { DocumentsHubClient } from "@/components/documents/DocumentsHubClient";
import type { LetterAudience, LetterKind } from "@/types/letters";

interface Props {
  searchParams: Promise<{ audience?: string; kind?: string; subjectId?: string }>;
}

export default async function DocumentsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const audience = (sp.audience === "staff" ? "staff" : "student") as LetterAudience;
  const kind = (sp.kind as LetterKind | undefined) ?? undefined;

  return (
    <>
      <PageHeader
        title="Letters & certificates"
        subtitle="Enrollment letters, leaving/clearance certificates, staff experience & HR letters"
      />
      <DocumentsHubClient
        initialAudience={audience}
        initialKind={kind}
        initialSubjectId={sp.subjectId}
      />
    </>
  );
}
