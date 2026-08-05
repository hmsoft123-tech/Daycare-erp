"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type ProgressEntry = {
  completed: boolean;
  completedAt?: string;
  lastWatchedAt?: string;
  viewCount: number;
};

type TrainingProgressState = {
  /** staffId or "demo-staff" → videoId → progress */
  byUser: Record<string, Record<string, ProgressEntry>>;
  recordView: (userId: string, videoId: string) => void;
  markComplete: (userId: string, videoId: string) => void;
  markIncomplete: (userId: string, videoId: string) => void;
  getEntry: (userId: string, videoId: string) => ProgressEntry;
  completedCount: (userId: string, videoIds: string[]) => number;
};

const empty: ProgressEntry = { completed: false, viewCount: 0 };

export const useTrainingProgressStore = create<TrainingProgressState>()(
  persist(
    (set, get) => ({
      byUser: {},

      getEntry: (userId, videoId) => get().byUser[userId]?.[videoId] ?? empty,

      recordView: (userId, videoId) =>
        set((s) => {
          const user = s.byUser[userId] ?? {};
          const cur = user[videoId] ?? empty;
          return {
            byUser: {
              ...s.byUser,
              [userId]: {
                ...user,
                [videoId]: {
                  ...cur,
                  viewCount: cur.viewCount + 1,
                  lastWatchedAt: new Date().toISOString(),
                },
              },
            },
          };
        }),

      markComplete: (userId, videoId) =>
        set((s) => {
          const user = s.byUser[userId] ?? {};
          const cur = user[videoId] ?? empty;
          return {
            byUser: {
              ...s.byUser,
              [userId]: {
                ...user,
                [videoId]: {
                  ...cur,
                  completed: true,
                  completedAt: new Date().toISOString(),
                  lastWatchedAt: new Date().toISOString(),
                  viewCount: Math.max(1, cur.viewCount),
                },
              },
            },
          };
        }),

      markIncomplete: (userId, videoId) =>
        set((s) => {
          const user = s.byUser[userId] ?? {};
          const cur = user[videoId] ?? empty;
          return {
            byUser: {
              ...s.byUser,
              [userId]: {
                ...user,
                [videoId]: {
                  ...cur,
                  completed: false,
                  completedAt: undefined,
                },
              },
            },
          };
        }),

      completedCount: (userId, videoIds) => {
        const user = get().byUser[userId] ?? {};
        return videoIds.filter((id) => user[id]?.completed).length;
      },
    }),
    { name: "kp-staff-training-progress" }
  )
);
