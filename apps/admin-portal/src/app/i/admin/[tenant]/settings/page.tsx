import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsClient } from "./SettingsClient";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Organization, roles, integrations, and operational setup (SDLC — not separate sidebar categories)"
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SettingsClient />
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            <p>Kinder Pilot ERP v0.1.0</p>
            <p className="mt-2">Multi-branch daycare management for Karachi operators.</p>
            <p className="mt-4 text-xs text-gray-400">Demo shell — provider connections are Phase 2.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
