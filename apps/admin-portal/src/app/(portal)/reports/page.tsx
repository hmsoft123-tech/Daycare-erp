import { PageHeader } from "@/components/layout/PageHeader";
import { BranchScorecard } from "@/components/reports/BranchScorecard";
import { BranchMap } from "@/components/reports/BranchMap";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { getBranchScorecards, getBranchRevenueData, getRevenueData } from "@/lib/mock-service";
import { ReportsRevenueClient } from "./ReportsRevenueClient";

export default async function ReportsPage() {
  const [scorecards, branchRevenue, revenue] = await Promise.all([
    getBranchScorecards(),
    getBranchRevenueData(),
    getRevenueData(),
  ]);

  return (
    <>
      <PageHeader title="Analytics & Reports" subtitle="Branch performance and network overview" />
      <div className="space-y-8">
        <BranchScorecard scorecards={scorecards} />
        <div className="grid gap-6 lg:grid-cols-2">
          <BranchMap />
          <RevenueChart data={revenue} />
        </div>
        <ReportsRevenueClient branchRevenue={branchRevenue} />
      </div>
    </>
  );
}
