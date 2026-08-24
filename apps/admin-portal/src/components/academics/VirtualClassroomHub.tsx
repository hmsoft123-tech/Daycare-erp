"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { virtualClasses, type VirtualClass } from "@/data/extended-ops";

export function VirtualClassroomHub() {
  const [rows, setRows] = useState(virtualClasses);
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState<VirtualClass["provider"]>("meet");
  const [joinUrl, setJoinUrl] = useState("");
  const [className, setClassName] = useState("Infant Room A");

  const add = () => {
    if (!title.trim() || !joinUrl.trim()) {
      toast.error("Title and join URL required");
      return;
    }
    const row: VirtualClass = {
      id: `vc-${Date.now()}`,
      title,
      className,
      teacherName: "Staff",
      provider,
      joinUrl,
      startsAt: new Date(Date.now() + 3600000).toISOString(),
      durationMin: 30,
      childIds: ["s1", "s2"],
      status: "upcoming",
    };
    setRows((prev) => [row, ...prev]);
    setTitle("");
    setJoinUrl("");
    toast.success("Session published to parent Virtual Classroom");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5 lg:col-span-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Class</Label>
            <Input value={className} onChange={(e) => setClassName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Provider</Label>
            <Select
              value={provider}
              onValueChange={(v) => setProvider(v as VirtualClass["provider"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meet">Google Meet</SelectItem>
                <SelectItem value="zoom">Zoom</SelectItem>
                <SelectItem value="teams">Microsoft Teams</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <Label>Join URL</Label>
            <Input value={joinUrl} onChange={(e) => setJoinUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={add} className="w-full">
              Publish session
            </Button>
          </div>
        </CardContent>
      </Card>

      <ul className="grid gap-2 sm:grid-cols-2">
        {rows.map((r) => (
          <li key={r.id}>
            <Card>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="text-xs text-muted">
                      {r.className} · {r.teacherName} · {r.provider.toUpperCase()}
                    </p>
                  </div>
                  <Badge
                    variant={r.status === "live" ? "success" : r.status === "ended" ? "secondary" : "info"}
                    className="capitalize"
                  >
                    {r.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted">
                  {new Date(r.startsAt).toLocaleString()} · {r.durationMin} min
                </p>
                <Button type="button" size="sm" variant="outline" asChild>
                  <a href={r.joinUrl} target="_blank" rel="noreferrer">
                    Open link
                  </a>
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
