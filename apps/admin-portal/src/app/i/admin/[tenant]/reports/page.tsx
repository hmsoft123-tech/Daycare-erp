import { PageHeader } from "@/components/layout/PageHeader";
import { BranchScorecard } from "@/components/reports/BranchScorecard";
import { BranchMap } from "@/components/reports/BranchMap";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { AnalyticsExtras } from "@/components/reports/AnalyticsExtras";
import { ModuleAnalyticsCatalog } from "@/components/reports/ModuleAnalyticsCatalog";
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
      <PageHeader
        title="Analytics & Reports"
        subtitle="Centralized module analytics · branch performance · exportable demos"
      />
      <div className="space-y-8">
        <ModuleAnalyticsCatalog />
        <BranchScorecard scorecards={scorecards} />
        <div className="grid gap-6 lg:grid-cols-2">
          <BranchMap />
          <RevenueChart data={revenue} />
        </div>
        <ReportsRevenueClient branchRevenue={branchRevenue} />
        <AnalyticsExtras />
      </div>
    </>
  );
}
