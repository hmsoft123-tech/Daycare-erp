"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type ViewEntry = {
  viewCount: number;
  lastViewedAt?: string;
};

type TrainingViewState = {
  byVideo: Record<string, ViewEntry>;
  recordView: (videoId: string) => void;
  getEntry: (videoId: string) => ViewEntry;
  viewedCount: (ids: string[]) => number;
};

export const useTrainingViewStore = create<TrainingViewState>()(
  persist(
    (set, get) => ({
      byVideo: {},
      getEntry: (videoId) => get().byVideo[videoId] ?? { viewCount: 0 },
      recordView: (videoId) =>
        set((s) => {
          const cur = s.byVideo[videoId] ?? { viewCount: 0 };
          return {
            byVideo: {
              ...s.byVideo,
              [videoId]: {
                viewCount: cur.viewCount + 1,
                lastViewedAt: new Date().toISOString(),
              },
            },
          };
        }),
      viewedCount: (ids) => ids.filter((id) => (get().byVideo[id]?.viewCount ?? 0) > 0).length,
    }),
    { name: "kp-parent-training-views" }
  )
);
