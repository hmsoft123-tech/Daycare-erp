import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import {
  getDashboardKPIs,
  getRevenueData,
  getRecentEnrollments,
  getStudents,
  getAdmissions,
  getInvoices,
} from "@/lib/mock-service";

export default async function DashboardPage() {
  const [kpis, revenue, enrollments, students, admissions, invoices] = await Promise.all([
    getDashboardKPIs(),
    getRevenueData(),
    getRecentEnrollments(),
    getStudents(),
    getAdmissions(),
    getInvoices(),
  ]);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of your daycare operations" />
      <DashboardContent
        kpis={kpis}
        revenue={revenue}
        enrollments={enrollments}
        students={students}
        admissions={admissions}
        invoices={invoices}
      />
    </>
  );
}
