"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/store";
import { toast } from "sonner";

export function SettingsClient() {
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();

  return (
    <Card>
      <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label>Collapsed Sidebar</Label>
            <p className="text-xs text-gray-500">Start with sidebar collapsed</p>
          </div>
          <Switch checked={sidebarCollapsed} onCheckedChange={setSidebarCollapsed} />
        </div>
        <div>
          <Label htmlFor="orgName">Organization Name</Label>
          <Input id="orgName" defaultValue="Kinder Pilot" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" defaultValue="Asia/Karachi" className="mt-1" />
        </div>
        <Button onClick={() => toast.success("Settings saved")}>Save Changes</Button>
      </CardContent>
    </Card>
  );
}
