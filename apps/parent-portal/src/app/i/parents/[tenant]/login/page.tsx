import {
  getTenantBranding,
} from "@kinder-pilot/api-client/tenant";
import { LoginForm } from "@/components/LoginForm";

type Props = { params: Promise<{ tenant: string }> };

export default async function LoginPage({ params }: Props) {
  const { tenant } = await params;
  const branding = await getTenantBranding(tenant);

  return <LoginForm schoolName={branding?.schoolName ?? "Kinder Pilot"} />;
}
