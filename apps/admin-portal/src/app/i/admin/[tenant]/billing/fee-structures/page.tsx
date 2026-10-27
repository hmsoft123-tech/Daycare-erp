import { PageHeader } from "@/components/layout/PageHeader";
import { FeeSetupHub } from "@/components/fees/FeeSetupHub";

export default function FeeStructuresPage() {
  return (
    <>
      <PageHeader
        title="Fee Structures"
        subtitle="Program fees, optional services and discount codes — the rules every admission is priced from"
      />
      <FeeSetupHub />
    </>
  );
}
