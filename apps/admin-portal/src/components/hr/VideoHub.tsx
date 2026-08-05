"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModalPortal } from "@/components/ui/modal-portal";
import { youtubeEmbedUrl, youtubeWatchUrl } from "@/data/training-videos";
import { STAFF_TOPIC_LABELS, PARENT_TOPIC_LABELS, topicLabel } from "@/lib/training";
import { useTrainingProgressStore } from "@/lib/training-progress-store";
import { useTenantStore } from "@/lib/tenant-store";
import type {
  ParentTrainingTopic,
  StaffTrainingTopic,
  TrainingAudience,
  TrainingTopic,
  TrainingVideo,
} from "@/types";
import { CheckCircle2, Clock, ExternalLink, Play, Video, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STAFF_USER = "demo-staff";

interface VideoHubProps {
  videos: TrainingVideo[];
  /** Default staff; admin can switch to parent library preview */
  defaultAudience?: TrainingAudience;
}

export function VideoHub({ videos, defaultAudience = "staff" }: VideoHubProps) {
  const [audience, setAudience] = useState<TrainingAudience>(defaultAudience);
  const [topic, setTopic] = useState<"all" | TrainingTopic>("all");
  const [active, setActive] = useState<TrainingVideo | null>(null);
  const userName = useTenantStore((s) => s.userName) ?? STAFF_USER;
  const userId = audience === "staff" ? `staff:${userName}` : `preview-parent`;

  const recordView = useTrainingProgressStore((s) => s.recordView);
  const markComplete = useTrainingProgressStore((s) => s.markComplete);
  const getEntry = useTrainingProgressStore((s) => s.getEntry);
  const completedCount = useTrainingProgressStore((s) => s.completedCount);

  const scoped = useMemo(
    () => videos.filter((v) => v.audience === audience && v.active !== false),
    [videos, audience]
  );

  const topics = useMemo(() => {
    if (audience === "staff") {
      return (Object.keys(STAFF_TOPIC_LABELS) as StaffTrainingTopic[]).filter((t) =>
        scoped.some((v) => v.topic === t)
      );
    }
    return (Object.keys(PARENT_TOPIC_LABELS) as ParentTrainingTopic[]).filter((t) =>
      scoped.some((v) => v.topic === t)
    );
  }, [audience, scoped]);

  const filtered = useMemo(
    () => (topic === "all" ? scoped : scoped.filter((v) => v.topic === topic)),
    [scoped, topic]
  );

  const featured = filtered.filter((v) => v.featured);
  const rest = filtered.filter((v) => !v.featured);
  const done = completedCount(
    userId,
    scoped.map((v) => v.id)
  );
  const pct = scoped.length ? Math.round((done / scoped.length) * 100) : 0;

  const openVideo = (video: TrainingVideo) => {
    recordView(userId, video.id);
    setActive(video);
  };

  const completeActive = () => {
    if (!active) return;
    markComplete(userId, active.id);
    toast.success(
      audience === "staff" ? "Marked complete — tracked for induction" : "View recorded"
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-[#F1F3F5] bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-heading">Training & Induction Video Hub</p>
          <p className="text-xs text-muted">YouTube-linked · {audience === "staff" ? "completion" : "view"} tracking</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={audience === "staff" ? "default" : "outline"}
            onClick={() => {
              setAudience("staff");
              setTopic("all");
            }}
          >
            Staff
          </Button>
          <Button
            type="button"
            size="sm"
            variant={audience === "parents" ? "default" : "outline"}
            onClick={() => {
              setAudience("parents");
              setTopic("all");
            }}
          >
            Parents (library)
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[140px] flex-1">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>{audience === "staff" ? "Your completion" : "Preview views"}</span>
            <span className="font-semibold text-heading">
              {done}/{scoped.length} · {pct}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-bg">
            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip active={topic === "all"} onClick={() => setTopic("all")} label="All topics" />
        {topics.map((t) => (
          <FilterChip
            key={t}
            active={topic === t}
            onClick={() => setTopic(t)}
            label={topicLabel(t, audience)}
          />
        ))}
      </div>

      {featured.length > 0 && (
        <section>
          <h3 className="mb-3 font-heading text-lg font-semibold text-heading">Featured</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {featured.map((video, i) => (
              <VideoCard
                key={video.id}
                video={video}
                index={i}
                large
                entry={getEntry(userId, video.id)}
                onOpen={() => openVideo(video)}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 font-heading text-lg font-semibold text-heading">
          {audience === "staff" ? "Staff library" : "Parent library"}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((video, i) => (
            <VideoCard
              key={video.id}
              video={video}
              index={i}
              entry={getEntry(userId, video.id)}
              onOpen={() => openVideo(video)}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[#DFE3E8] px-4 py-10 text-center text-sm text-muted">
            No videos in this topic yet.
          </p>
        )}
      </section>

      <ModalPortal open={!!active} onClose={() => setActive(null)} maxWidth="max-w-3xl">
        {active && (
          <>
            <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-5 py-4">
              <div className="pr-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  <Video className="h-3.5 w-3.5 text-red-600" />
                  {topicLabel(active.topic, active.audience)}
                </p>
                <h2 className="mt-1 font-heading text-lg font-bold text-heading">{active.title}</h2>
                <p className="mt-1 text-sm text-muted">{active.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="rounded-full p-2 text-muted hover:bg-bg"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="aspect-video overflow-hidden rounded-xl bg-black">
                <iframe
                  title={active.title}
                  src={youtubeEmbedUrl(active.youtubeId)}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {audience === "staff" ? (
                  <Button type="button" onClick={completeActive}>
                    <CheckCircle2 className="h-4 w-4" />
                    Mark complete
                  </Button>
                ) : (
                  <Button type="button" onClick={completeActive} variant="outline">
                    Record view
                  </Button>
                )}
                <Button type="button" variant="outline" asChild>
                  <a href={youtubeWatchUrl(active.youtubeId)} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Open on YouTube
                  </a>
                </Button>
                <span className="ml-auto text-xs text-muted">
                  Views: {getEntry(userId, active.id).viewCount}
                  {getEntry(userId, active.id).completed ? " · Completed" : ""}
                </span>
              </div>
            </div>
          </>
        )}
      </ModalPortal>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition",
        active ? "bg-brand-500 text-white" : "bg-bg text-muted hover:bg-brand-50"
      )}
    >
      {label}
    </button>
  );
}

function VideoCard({
  video,
  index,
  large,
  entry,
  onOpen,
}: {
  video: TrainingVideo;
  index: number;
  large?: boolean;
  entry: { completed: boolean; viewCount: number };
  onOpen: () => void;
}) {
  const progress = entry.completed ? 100 : entry.viewCount > 0 ? 40 : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card
        className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
        onClick={onOpen}
      >
        <div className={`relative bg-brand-900 ${large ? "h-48" : "h-36"}`}>
          {video.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={video.thumbnail} alt="" className="h-full w-full object-cover opacity-90" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Play className="h-12 w-12 text-white/60" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
            <Play className="h-10 w-10 text-white" />
          </div>
          <Badge className="absolute left-2 top-2" variant="secondary">
            {topicLabel(video.topic, video.audience)}
          </Badge>
          {entry.completed && (
            <Badge className="absolute right-2 top-2" variant="success">
              Done
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <p className="font-medium line-clamp-2 text-heading">{video.title}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted">{video.description}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-muted">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {video.duration}
            </span>
            <span className="flex items-center gap-1">
              <Video className="h-3 w-3 text-red-600" />
              {entry.viewCount ? `${entry.viewCount} view${entry.viewCount === 1 ? "" : "s"}` : "Not started"}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${progress}%` }} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
