import { cache } from "react";
import { headers } from "next/headers";
import { resolveTenant } from "@kinder-pilot/api-client/server";

const FALLBACK_NAME = "Kinder Pilot";

/** The school this address belongs to, for public pages (server components only). */
export const getSchoolName = cache(async (): Promise<string> => {
  const host = (await headers()).get("host");
  return (await resolveTenant(host))?.companyName || FALLBACK_NAME;
});
