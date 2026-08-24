import { PageHeader } from "@/components/layout/PageHeader";
import { LibraryHub } from "@/components/library/LibraryHub";

export default function LibraryPage() {
  return (
    <>
      <PageHeader
        title="Digital Library"
        subtitle="Issue → parent portal → due date → return"
      />
      <LibraryHub />
    </>
  );
}
