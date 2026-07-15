import { getTenantBranding } from "@kinder-pilot/api-client/tenant";
import { AppShell } from "@/components/AppShell";

type Props = {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
};

export default async function AuthenticatedLayout({ children, params }: Props) {
  const { tenant } = await params;
  const branding = await getTenantBranding(tenant);

  return (
    <AppShell schoolName={branding?.schoolName ?? "Kinder Pilot"}>
      {children}
    </AppShell>
  );
}
