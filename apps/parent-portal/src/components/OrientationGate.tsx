"use client";

import { useOnboardingGate } from "@/lib/onboarding-gate";
import { useTrainingViewStore } from "@/lib/training-view-store";
import { youtubeEmbedUrl } from "@/lib/training-catalog";

/** Full-screen block on first login until the mandatory orientation webinar is watched. */
export function OrientationGate() {
  const { video, complete } = useOnboardingGate();
  const recordView = useTrainingViewStore((s) => s.recordView);

  if (complete || !video) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          Welcome — before you continue
        </p>
        <h2 className="mt-1 font-heading text-lg font-bold text-heading">{video.title}</h2>
        <p className="mt-1 text-sm text-muted">{video.description}</p>
        <div className="mt-4 aspect-video overflow-hidden rounded-xl bg-black">
          <iframe
            title={video.title}
            src={youtubeEmbedUrl(video.youtubeId)}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <button
          type="button"
          onClick={() => recordView(video.id)}
          className="mt-4 w-full rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white"
        >
          I've watched this — Continue to portal
        </button>
      </div>
    </div>
  );
}
