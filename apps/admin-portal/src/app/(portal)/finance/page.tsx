import { PageHeader } from "@/components/layout/PageHeader";
import { FinanceHub } from "@/components/finance/FinanceHub";

export default function FinancePage() {
  return (
    <>
      <PageHeader
        title="Finance & Accounts"
        subtitle="Chart of Accounts, vouchers, fixed assets, and accounting reports"
      />
      <FinanceHub />
    </>
  );
}
