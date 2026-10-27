import { createBffProxy } from "@kinder-pilot/api-client/server";

/**
 * Authenticated proxy to the KinderPilot API (`/api/bff/<path>` → `/api/v1/<path>`).
 * Only Phase 1 modules are reachable; add a pattern here when a module is integrated.
 */
const handler = createBffProxy({
  allow: [
    /^admissions(\/|$)/, // inquiries, kanban, enrollment, fee lock, waitlist, transfers, challans
    /^fees(\/|$)/, // structures, discounts, calculate
    /^hierarchy(\/|$)/, // company, branches, classrooms (assignment pickers)
    /^branches\/[^/]+\/staff$/, // branch staff user accounts
    /^students(\/|$)/,
    /^security\/rbac(\/|$)/, // role approvals, break-glass log
    /^companies\/[^/]+\/widget(\/key)?$/, // website widget settings, public key and key rotation
  ],
});

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };

export const dynamic = "force-dynamic";
