import { PageHeader } from "@/components/layout/PageHeader";
import { MonthlyChallanGenerator } from "@/components/billing/MonthlyChallanGenerator";

export default function MonthlyChallansPage() {
  return (
    <>
      <PageHeader
        title="Monthly Challans"
        subtitle="Bill every student's tuition and active monthly services for a month, less their credit balance"
      />
      <MonthlyChallanGenerator />
    </>
  );
}
