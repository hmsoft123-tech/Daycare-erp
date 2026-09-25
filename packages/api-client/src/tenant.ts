import type { Tenant, TenantBranding } from "@kinder-pilot/types";
import { isSafeHexColor } from "./security";

/** Seed tenants — replace with Redis / config service in production */
export const TENANTS: Record<string, Tenant> = {
  drsofiasdaycare: {
    id: "tnt_sofia",
    slug: "drsofiasdaycare",
    schoolName: "Dr. Sofia's Daycare",
    customDomains: ["portal.drsofiasdaycare.com"],
    primaryColor: "#FF6A3D",
    secondaryColor: "#4C8BF5",
    logoUrl: "/tenants/sofia-logo.svg",
    status: "active",
  },
  "kinder-pilot": {
    id: "tnt_demo",
    slug: "kinder-pilot",
    schoolName: "Kinder Pilot Demo",
    customDomains: [],
    primaryColor: "#FF6A3D",
    secondaryColor: "#4C8BF5",
    logoUrl: "/tenants/demo-logo.svg",
    status: "active",
  },
};

const CUSTOM_DOMAIN_MAP: Record<string, string> = {
  "portal.drsofiasdaycare.com": "drsofiasdaycare",
};

export function resolveTenantSlugFromHost(host: string): string | null {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";

  if (CUSTOM_DOMAIN_MAP[hostname]) return CUSTOM_DOMAIN_MAP[hostname];

  // wildcard: {slug}.kinderpilot.com
  const platformMatch = hostname.match(/^([a-z0-9-]+)\.kinderpilot\.com$/i);
  if (platformMatch?.[1] && platformMatch[1] !== "www" && platformMatch[1] !== "app") {
    return platformMatch[1];
  }

  // local / preview fallbacks
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local")) {
    return process.env.NEXT_PUBLIC_DEFAULT_TENANT ?? "kinder-pilot";
  }

  return null;
}

export function lighten(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  const num = parseInt(n.length === 3 ? n.split("").map((c) => c + c).join("") : n, 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function darken(hex: string, amount: number): string {
  return lighten(hex, -amount);
}

export function buildBrandPalette(primary: string): NonNullable<TenantBranding["palette"]> {
  return {
    50: lighten(primary, 180),
    100: lighten(primary, 140),
    200: lighten(primary, 100),
    300: lighten(primary, 60),
    400: lighten(primary, 30),
    500: primary,
    600: darken(primary, 20),
    700: darken(primary, 40),
    800: darken(primary, 60),
    900: darken(primary, 80),
  };
}

/**
 * TODO: Replace with Redis / config API:
 * fetch(`${CONFIG_API}/tenants/${slug}/branding`, { next: { revalidate: 60 } })
 */
export async function getTenantBranding(slug: string): Promise<TenantBranding | null> {
  const tenant = TENANTS[slug];
  if (!tenant) return null;

  await Promise.resolve(); // simulate edge cache hop

  return {
    primaryColor: tenant.primaryColor,
    secondaryColor: tenant.secondaryColor,
    logoUrl: tenant.logoUrl,
    schoolName: tenant.schoolName,
    palette: buildBrandPalette(tenant.primaryColor),
  };
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  return TENANTS[slug] ?? null;
}

const FALLBACK_PRIMARY = "#FF6A3D";
const FALLBACK_SECONDARY = "#4C8BF5";

/**
 * Output is injected into a raw <style> tag, so every value must be a strict hex
 * color — otherwise tenant branding from the API could break out with `</style><script>`.
 */
export function brandingToCssVariables(branding: TenantBranding): string {
  const primary = isSafeHexColor(branding.primaryColor) ? branding.primaryColor : FALLBACK_PRIMARY;
  const secondary = isSafeHexColor(branding.secondaryColor)
    ? branding.secondaryColor
    : FALLBACK_SECONDARY;
  const generated = buildBrandPalette(primary);
  const lines = Object.entries(generated).map(([k, fallback]) => {
    const v = branding.palette?.[k as keyof typeof generated];
    return `--brand-${k}: ${isSafeHexColor(v) ? v : fallback};`;
  });
  lines.push(`--brand-secondary: ${secondary};`);
  return lines.join(" ");
}
