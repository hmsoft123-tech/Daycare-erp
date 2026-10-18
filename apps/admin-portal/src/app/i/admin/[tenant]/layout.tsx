import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import {
  brandingToCssVariables,
  buildBrandPalette,
  getTenantBranding,
} from "@kinder-pilot/api-client/tenant";
import {
  SESSION_COOKIE,
  devFallbackTenant,
  resolveTenant,
  toPublicUser,
  unsealSession,
} from "@kinder-pilot/api-client/server";
import type { TenantBranding } from "@kinder-pilot/types";
import { PortalShell } from "@/components/layout/PortalShell";
import { AppProviders } from "@/components/providers/AppProviders";

type Props = {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
};

function defaultBranding(schoolName: string): TenantBranding {
  const primaryColor = "#FF6A3D";
  return {
    primaryColor,
    secondaryColor: "#4C8BF5",
    logoUrl: "",
    schoolName,
    palette: buildBrandPalette(primaryColor),
  };
}

/**
 * Tenant shell — verifies the session belongs to this school, then injects
 * branding CSS variables before paint.
 * Internal path: /i/admin/[tenant]/... (rewritten from /dashboard etc.)
 */
export default async function AdminTenantLayout({ children, params }: Props) {
  const { tenant } = await params;
  const host = (await headers()).get("host");
  const [resolvedTenant, signedSession] = await Promise.all([
    resolveTenant(host),
    unsealSession((await cookies()).get(SESSION_COOKIE)?.value),
  ]);

  const tenantInfo = resolvedTenant ?? devFallbackTenant(host);
  if (!tenantInfo) notFound();

  // Middleware already gates this; re-check here so a session from another
  // school (or an expired one) can never render this tenant's portal.
  const session = signedSession?.tenantId === tenantInfo.tenantId ? signedSession : null;
  if (!session) redirect("/login");

  // Branding API isn't available yet — seeded palette when known, defaults otherwise.
  const branding = (await getTenantBranding(tenant)) ?? defaultBranding(tenantInfo.companyName);
  const cssVars = brandingToCssVariables(branding);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `:root { ${cssVars} }` }} />
      <AppProviders
        tenantSlug={tenant}
        tenantId={tenantInfo.tenantId}
        branding={{ ...branding, schoolName: tenantInfo.companyName || branding.schoolName }}
        user={toPublicUser(session)}
      >
        <PortalShell schoolName={tenantInfo.companyName || branding.schoolName} logoUrl={branding.logoUrl}>
          {children}
        </PortalShell>
      </AppProviders>
    </>
  );
}
