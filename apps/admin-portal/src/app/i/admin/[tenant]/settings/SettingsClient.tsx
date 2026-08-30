"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "organization", label: "Organization" },
  { id: "users", label: "Users & roles" },
  { id: "notifications", label: "Notifications" },
  { id: "integrations", label: "Integrations" },
  { id: "operations", label: "Operations" },
  { id: "security", label: "Security" },
  { id: "preferences", label: "Preferences" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsClient() {
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const [tab, setTab] = useState<TabId>("organization");

  const save = () => toast.success("Settings saved (demo)");

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
              tab === t.id ? "bg-brand-500 text-white" : "bg-white text-muted border border-[#F1F3F5]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "organization" && (
        <Card>
          <CardHeader>
            <CardTitle>Organization & branches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field id="orgName" label="Organization name" defaultValue="Kinder Pilot" />
            <Field id="timezone" label="Timezone" defaultValue="Asia/Karachi" />
            <Field id="hq" label="Head office" defaultValue="North Nazimabad HQ" />
            <p className="text-xs text-muted">
              Branch list is managed via the top branch switcher. Multi-branch setup is demo-ready.
            </p>
            <Button onClick={save}>Save Changes</Button>
          </CardContent>
        </Card>
      )}

      {tab === "users" && (
        <Card>
          <CardHeader>
            <CardTitle>Users, roles & permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { role: "Administrator", users: 2, note: "Full ERP access" },
              { role: "Branch Head", users: 4, note: "Branch-scoped ops" },
              { role: "Teacher", users: 18, note: "Attendance, academics, incidents" },
              { role: "Finance", users: 3, note: "Billing & fee locks" },
            ].map((r) => (
              <div key={r.role} className="flex items-center justify-between rounded-xl border border-[#F1F3F5] px-3 py-2.5">
                <div>
                  <p className="font-semibold">{r.role}</p>
                  <p className="text-xs text-muted">{r.note}</p>
                </div>
                <span className="text-xs font-semibold text-muted">{r.users} users</span>
              </div>
            ))}
            <p className="text-xs text-muted">RBAC keys exist in code; this panel is a demo shell for client walkthrough.</p>
            <Button onClick={save}>Save role defaults</Button>
          </CardContent>
        </Card>
      )}

      {tab === "notifications" && (
        <Card>
          <CardHeader>
            <CardTitle>Notification settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleRow label="In-app parent alerts" defaultChecked />
            <ToggleRow label="Staff digests" defaultChecked />
            <ToggleRow label="Fee overdue reminders" defaultChecked />
            <ToggleRow label="Incident escalation to HO" defaultChecked />
            <Button onClick={save}>Save</Button>
          </CardContent>
        </Card>
      )}

      {tab === "integrations" && (
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { name: "Payment (JazzCash / card / bank)", status: "Demo UX only" },
              { name: "SMS provider", status: "Not connected · Phase 2" },
              { name: "WhatsApp Business", status: "Not connected · Phase 2" },
              { name: "Email (transactional)", status: "Not connected · Phase 2" },
              { name: "Biometric attendance", status: "Config placeholder" },
              { name: "CCTV consent & access", status: "Parent consent gate demo" },
            ].map((i) => (
              <div key={i.name} className="flex items-center justify-between rounded-xl border border-[#F1F3F5] px-3 py-2.5">
                <p className="font-medium">{i.name}</p>
                <span className="text-[11px] text-muted">{i.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === "operations" && (
        <Card>
          <CardHeader>
            <CardTitle>Operational setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-xs text-muted">
              SDLC: meals, transport, facilities, cleaning, calendars, rooms, and maintenance stay under Settings — not separate sidebar categories.
            </p>
            {[
              "Meals & kitchen menus",
              "Transport routes & vehicles",
              "Facilities & rooms",
              "Cleaning & hygiene checklists",
              "Calendars & annual planner",
              "Equipment register",
              "Maintenance schedules & vendor history",
              "Recurring service reminders",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-[#F1F3F5] px-3 py-2.5 font-medium">
                {item}
                <span className="ml-2 text-[11px] font-normal text-muted">· demo tab</span>
              </div>
            ))}
            <Button onClick={save}>Save ops preferences</Button>
          </CardContent>
        </Card>
      )}

      {tab === "security" && (
        <Card>
          <CardHeader>
            <CardTitle>Security & data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleRow label="Require two-factor authentication" defaultChecked={false} />
            <Field id="retention" label="Data retention (months)" defaultValue="36" />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => toast.message("Export queued (demo)")}>
                Export data
              </Button>
              <Button variant="secondary" onClick={() => toast.message("Backup started (demo)")}>
                Backup now
              </Button>
            </div>
            <p className="text-xs text-muted">Audit log viewer · Phase 2 deep dive</p>
          </CardContent>
        </Card>
      )}

      {tab === "preferences" && (
        <Card>
          <CardHeader>
            <CardTitle>Workspace preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Collapsed Sidebar</Label>
                <p className="text-xs text-gray-500">Start with sidebar collapsed</p>
              </div>
              <Switch checked={sidebarCollapsed} onCheckedChange={setSidebarCollapsed} />
            </div>
            <Button onClick={save}>Save Changes</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ id, label, defaultValue }: { id: string; label: string; defaultValue: string }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} defaultValue={defaultValue} className="mt-1" />
    </div>
  );
}

function ToggleRow({ label, defaultChecked = false }: { label: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between gap-3">
      <Label>{label}</Label>
      <Switch checked={on} onCheckedChange={setOn} />
    </div>
  );
}
