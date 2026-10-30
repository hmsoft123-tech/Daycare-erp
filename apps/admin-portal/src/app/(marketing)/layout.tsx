import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { getSchoolName } from "@/lib/school-name";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const schoolName = await getSchoolName();
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader schoolName={schoolName} />
      <main className="flex-1">{children}</main>
      <MarketingFooter schoolName={schoolName} />
    </div>
  );
}
