import { notFound } from "next/navigation";
import {
  brandingToCssVariables,
  getTenantBranding,
  getTenantBySlug,
} from "@kinder-pilot/api-client/tenant";
import { PortalShell } from "@/components/layout/PortalShell";
import { AppProviders } from "@/components/providers/AppProviders";

type Props = {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
};

/**
 * Tenant shell — fetches branding and injects CSS variables before paint.
 * Internal path: /i/admin/[tenant]/... (rewritten from /dashboard etc.)
 * Note: Next.js treats `_`-prefixed folders as private, so we use `i/admin`.
 */
export default async function AdminTenantLayout({ children, params }: Props) {
  const { tenant } = await params;
  const [branding, tenantRecord] = await Promise.all([
    getTenantBranding(tenant),
    getTenantBySlug(tenant),
  ]);

  if (!branding || !tenantRecord) {
    notFound();
  }

  const cssVars = brandingToCssVariables(branding);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `:root { ${cssVars} }` }} />
      <AppProviders
        tenantSlug={tenant}
        tenantId={tenantRecord.id}
        branding={branding}
      >
        <PortalShell schoolName={branding.schoolName} logoUrl={branding.logoUrl}>
          {children}
        </PortalShell>
      </AppProviders>
    </>
  );
}
