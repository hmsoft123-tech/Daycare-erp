import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsClient } from "./SettingsClient";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Configure your Kinder Pilot workspace" />
      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsClient />
        <Card>
          <CardHeader><CardTitle>About</CardTitle></CardHeader>
          <CardContent className="text-sm text-gray-600">
            <p>Kinder Pilot ERP v0.1.0</p>
            <p className="mt-2">Multi-branch daycare management for Karachi operators.</p>
            <p className="mt-4 text-xs text-gray-400">Licensed by Sindh Education Foundation</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
