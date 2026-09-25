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
import { postParentOpsAction } from "@/lib/parent-ops-client";
import { safeExternalUrl } from "@kinder-pilot/api-client/security";

export function VirtualClassroomHub() {
  const [rows, setRows] = useState(virtualClasses);
  const [sessionCategory, setSessionCategory] = useState<VirtualClass["sessionCategory"]>("live");
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState<VirtualClass["provider"]>("meet");
  const [joinUrl, setJoinUrl] = useState("");
  const [recordingUrl, setRecordingUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [className, setClassName] = useState("Infant Room A");

  const add = async () => {
    if (!title.trim()) {
      toast.error("Title required");
      return;
    }
    if (sessionCategory === "live" && !joinUrl.trim()) {
      toast.error("Join URL required for a live session");
      return;
    }
    if (sessionCategory === "recorded" && !recordingUrl.trim()) {
      toast.error("Recording URL required for a recorded lesson");
      return;
    }
    const link = sessionCategory === "live" ? joinUrl : recordingUrl;
    if (!/^https?:\/\//i.test(link.trim()) || !safeExternalUrl(link)) {
      toast.error("Enter a full link starting with https://");
      return;
    }
    const result = await postParentOpsAction<VirtualClass>({
      action: "createVirtualClass",
      title: title.trim(),
      className,
      provider,
      sessionCategory,
      joinUrl: sessionCategory === "live" ? joinUrl.trim() : "",
      recordingUrl: sessionCategory === "recorded" ? recordingUrl.trim() : undefined,
      topic: sessionCategory === "recorded" ? topic.trim() || undefined : undefined,
      teacherName: "Staff",
      childIds: ["s1", "s2"],
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setRows((prev) => [result.item, ...prev]);
    setTitle("");
    setJoinUrl("");
    setRecordingUrl("");
    setTopic("");
    toast.success(
      sessionCategory === "live"
        ? "Live session published — parent School → Virtual Class"
        : "Recorded lesson published — parent School → Virtual Class"
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5 lg:col-span-2">
            <Label>Session type</Label>
            <Select
              value={sessionCategory}
              onValueChange={(v) => setSessionCategory(v as VirtualClass["sessionCategory"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="live">Live class</SelectItem>
                <SelectItem value="recorded">Topic-wise recorded lesson</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 lg:col-span-3">
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
          {sessionCategory === "live" ? (
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <Label>Join URL</Label>
              <Input value={joinUrl} onChange={(e) => setJoinUrl(e.target.value)} placeholder="https://…" />
            </div>
          ) : (
            <>
              <div className="space-y-1.5 lg:col-span-2">
                <Label>Recording URL</Label>
                <Input
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Topic</Label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Phonics" />
              </div>
            </>
          )}
          <div className="flex items-end">
            <Button type="button" onClick={() => void add()} className="w-full">
              Publish
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
                      {r.topic ? ` · ${r.topic}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant={r.status === "live" ? "success" : r.status === "ended" ? "secondary" : "info"}
                    className="capitalize"
                  >
                    {r.sessionCategory === "recorded" ? "Recorded" : r.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted">
                  {new Date(r.startsAt).toLocaleString()} · {r.durationMin} min
                </p>
                <Button type="button" size="sm" variant="outline" asChild>
                  <a href={r.sessionCategory === "recorded" ? r.recordingUrl : r.joinUrl} target="_blank" rel="noreferrer">
                    {r.sessionCategory === "recorded" ? "Open recording" : "Open link"}
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
