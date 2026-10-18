import Link from "next/link";
import { cookies, headers } from "next/headers";
import { ShieldAlert } from "lucide-react";
import { SESSION_COOKIE, unsealSession } from "@kinder-pilot/api-client/server";
import { Button } from "@/components/ui/button";
import { CAPABILITIES, ROLE_LABELS, type Capability } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const AREA_LABELS: Partial<Record<Capability, string>> = {
  "admissions.view": "Admissions",
  "admissions.update": "the Enrollment Wizard",
  "students.read": "Students",
  "fees.lock": "Head Office fee approvals",
  "fees.manage": "fee setup",
  "finance.view": "Billing & Finance",
  "hr.manage": "HR & Staff",
  "family.manage": "Parents & Communications",
  "classroom.view": "Classrooms & Academics",
  "operations.manage": "Operations & Inventory",
  "reports.view": "Reports",
  "settings.manage": "Settings",
  "erp.access": "the ERP console",
};

/** Shown in place of a page the user's role cannot open (middleware rewrites here). */
export default async function AccessDeniedPage() {
  const capability = (await headers()).get("x-denied-capability") as Capability | null;
  const session = await unsealSession((await cookies()).get(SESSION_COOKIE)?.value);
  const rule: { roles: readonly string[]; authority?: string } | null = capability
    ? CAPABILITIES[capability]
    : null;
  const area = (capability && AREA_LABELS[capability]) || "this page";
  const yourRoles = session?.roles.map((r) => ROLE_LABELS[r] ?? r).join(", ") || "no role";
  const allowed = rule?.roles.map((r) => ROLE_LABELS[r] ?? r).join(", ");
  const isParent = !!session?.roles.includes("PARENT");

  return (
    <div className="mx-auto max-w-lg rounded-2xl bg-surface p-8 text-center shadow-card">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-soft-red text-danger">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h1 className="mt-5 font-heading text-xl font-bold text-heading">Access denied</h1>
      <p className="mt-2 text-sm text-muted">
        Your role ({yourRoles}) cannot open {area}.
        {isParent ? " Parents use the parent portal." : " Ask your administrator if you need access."}
      </p>
      {allowed && (
        <p className="mt-3 text-xs text-muted">
          Allowed for: {allowed}
          {rule?.authority ? ` · or permission ${rule.authority}` : ""}
        </p>
      )}
      {capability !== "erp.access" && (
        <Button asChild className="mt-6">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      )}
    </div>
  );
}
