import { notFound } from "next/navigation";
import {
  brandingToCssVariables,
  getTenantBranding,
  getTenantBySlug,
} from "@kinder-pilot/api-client/tenant";

type Props = {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
};

/** Tenant branding only — shells live in route-group layouts */
export default async function ParentTenantLayout({ children, params }: Props) {
  const { tenant } = await params;
  const [branding, record] = await Promise.all([
    getTenantBranding(tenant),
    getTenantBySlug(tenant),
  ]);

  if (!branding || !record) notFound();

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `:root { ${brandingToCssVariables(branding)} }`,
        }}
      />
      {children}
    </>
  );
}
