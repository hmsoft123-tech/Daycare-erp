import { PageHeader } from "@/components/layout/PageHeader";
import { BillingPipelineHub } from "@/components/billing/BillingPipelineHub";

type Props = {
  searchParams: Promise<{ step?: string }>;
};

export default async function BillingOpsPage({ searchParams }: Props) {
  const { step } = await searchParams;
  return (
    <>
      <PageHeader
        title="HO Billing Pipeline"
        subtitle="Fee structure through reconciliation and MIS — Head Office workflow"
      />
      <BillingPipelineHub activeStep={step} />
    </>
  );
}
