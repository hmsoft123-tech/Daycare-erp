import { createPublicProxy } from "@kinder-pilot/api-client/server";

/**
 * Unauthenticated proxy for marketing-site forms and tokenized enrollment links
 * (`/api/public/<path>` → `/api/v1/public/<path>`).
 */
const handler = createPublicProxy({
  allow: [
    /^forms\/(general-inquiry|online-registration|employment-application|corporate-partnership|franchise-application|feedback|tour-appointment)$/,
    /^enrollment\/validate-token\/[A-Za-z0-9_-]{8,128}$/,
    /^enrollment\/[A-Za-z0-9_-]{8,128}\/(submit|documents)$/,
    // Website widget lookups for the public inquiry form (branches, programs per branch)
    /^widget\/[A-Za-z0-9_-]{8,128}\/branches(\/\d{1,12}\/programs)?$/,
  ],
});

export { handler as GET, handler as POST };

export const dynamic = "force-dynamic";
