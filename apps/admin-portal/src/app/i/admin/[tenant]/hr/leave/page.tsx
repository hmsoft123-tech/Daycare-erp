import { PageHeader } from "@/components/layout/PageHeader";
import { LeaveHub } from "@/components/hr/LeaveHub";

export default function LeavePage() {
  return (
    <>
      <PageHeader
        title="Leave Management"
        subtitle="Apply · view · approve / reject · balance"
      />
      <LeaveHub />
    </>
  );
}
