import { PortalShell } from "@/components/layout/PortalShell";
import { QueryProvider } from "@/components/providers/QueryProvider";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <PortalShell>{children}</PortalShell>
    </QueryProvider>
  );
}
