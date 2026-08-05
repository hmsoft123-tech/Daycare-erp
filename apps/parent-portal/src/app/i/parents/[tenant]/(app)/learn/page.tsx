"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, ExternalLink, Play, Video, X } from "lucide-react";
import { cn } from "@kinder-pilot/ui";
import {
  fetchParentTrainingVideos,
  PARENT_TOPIC_LABELS,
  youtubeEmbedUrl,
  youtubeWatchUrl,
  type ParentTrainingTopic,
  type ParentTrainingVideo,
} from "@/lib/training-catalog";
import { useTrainingViewStore } from "@/lib/training-view-store";

export default function ParentLearnPage() {
  const [videos, setVideos] = useState<ParentTrainingVideo[]>([]);
  const [topic, setTopic] = useState<"all" | ParentTrainingTopic>("all");
  const [active, setActive] = useState<ParentTrainingVideo | null>(null);
  const recordView = useTrainingViewStore((s) => s.recordView);
  const getEntry = useTrainingViewStore((s) => s.getEntry);
  const viewedCount = useTrainingViewStore((s) => s.viewedCount);

  useEffect(() => {
    fetchParentTrainingVideos().then(setVideos);
  }, []);

  const filtered = useMemo(
    () => (topic === "all" ? videos : videos.filter((v) => v.topic === topic)),
    [videos, topic]
  );

  const seen = viewedCount(videos.map((v) => v.id));
  const pct = videos.length ? Math.round((seen / videos.length) * 100) : 0;

  const open = (v: ParentTrainingVideo) => {
    recordView(v.id);
    setActive(v);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-heading md:text-2xl lg:text-3xl">Learn</h1>
          <p className="mt-1 text-sm text-muted">
            Orientation, app guides &amp; policy explainers (YouTube)
          </p>
        </div>
        <section className="w-full rounded-2xl bg-surface p-4 shadow-card sm:max-w-xs">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>Videos viewed</span>
            <span className="font-semibold text-heading">
              {seen}/{videos.length || "—"} · {pct}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-bg">
            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </section>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(Object.keys(PARENT_TOPIC_LABELS) as Array<"all" | ParentTrainingTopic>).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTopic(key)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
              topic === key ? "bg-brand-500 text-white" : "bg-surface text-muted shadow-card"
            )}
          >
            {PARENT_TOPIC_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {filtered.map((video) => {
          const entry = getEntry(video.id);
          return (
            <button
              key={video.id}
              type="button"
              onClick={() => open(video)}
              className="flex w-full gap-3 rounded-2xl bg-surface p-3 text-left shadow-card transition hover:shadow-[0_8px_28px_rgba(31,41,51,0.1)] sm:flex-col sm:p-0 sm:overflow-hidden"
            >
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-brand-900 sm:h-40 sm:w-full sm:rounded-none">
                {video.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={video.thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Play className="h-6 w-6 text-white/70" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Play className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="min-w-0 flex-1 sm:p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
                  {PARENT_TOPIC_LABELS[video.topic]}
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-heading">{video.title}</p>
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {video.duration}
                  </span>
                  {entry.viewCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-brand-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Viewed {entry.viewCount}×
                    </span>
                  ) : (
                    <span>Not viewed</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
        {!filtered.length && (
          <p className="rounded-2xl border border-dashed border-black/10 px-4 py-8 text-center text-sm text-muted sm:col-span-2 lg:col-span-3">
            Loading videos…
          </p>
        )}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface shadow-xl sm:max-w-2xl sm:rounded-3xl">
            <div className="flex items-start justify-between border-b border-black/[0.06] px-4 py-3">
              <div className="pr-3">
                <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted">
                  <Video className="h-3.5 w-3.5 text-red-600" />
                  {PARENT_TOPIC_LABELS[active.topic]}
                </p>
                <h2 className="mt-1 text-base font-bold text-heading">{active.title}</h2>
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
            <div className="space-y-3 p-4">
              <div className="aspect-video overflow-hidden rounded-2xl bg-black">
                <iframe
                  title={active.title}
                  src={youtubeEmbedUrl(active.youtubeId)}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="text-sm text-muted">{active.description}</p>
              <a
                href={youtubeWatchUrl(active.youtubeId)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open on YouTube
              </a>
              <p className="text-[11px] text-muted">
                View tracked · {getEntry(active.id).viewCount} time
                {getEntry(active.id).viewCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
