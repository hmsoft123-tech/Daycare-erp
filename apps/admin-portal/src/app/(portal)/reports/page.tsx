import { PageHeader } from "@/components/layout/PageHeader";
import { AnalyticsReportsHub } from "@/components/reports/AnalyticsReportsHub";
import { getBranchScorecards, getBranchRevenueData, getRevenueData } from "@/lib/mock-service";

export default async function ReportsPage() {
  const [scorecards, branchRevenue, revenue] = await Promise.all([
    getBranchScorecards(),
    getBranchRevenueData(),
    getRevenueData(),
  ]);

  return (
    <>
      <PageHeader
        title="Analytics & Reports"
        subtitle="Browse by category — Overview · Finance · Academic · Operations · People"
      />
      <AnalyticsReportsHub
        scorecards={scorecards}
        branchRevenue={branchRevenue}
        revenue={revenue}
      />
    </>
  );
}
