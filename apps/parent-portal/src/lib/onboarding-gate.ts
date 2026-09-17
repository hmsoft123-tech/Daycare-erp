"use client";

import { useEffect, useState } from "react";
import { fetchParentTrainingVideos, type ParentTrainingVideo } from "@/lib/training-catalog";
import { useTrainingViewStore } from "@/lib/training-view-store";

/** Gates the portal on the mandatory orientation webinar until it's been watched once. */
export function useOnboardingGate() {
  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState<ParentTrainingVideo | null>(null);
  const viewCount = useTrainingViewStore((s) => (video ? s.getEntry(video.id).viewCount : 0));

  useEffect(() => {
    fetchParentTrainingVideos().then((videos) => {
      setVideo(videos.find((v) => v.requiredForOnboarding) ?? null);
      setLoading(false);
    });
  }, []);

  return {
    loading,
    video,
    complete: loading || !video || viewCount > 0,
  };
}
