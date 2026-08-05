export type ParentTrainingTopic = "orientation" | "app_guide" | "policy";

export type ParentTrainingVideo = {
  id: string;
  title: string;
  description: string;
  duration: string;
  topic: ParentTrainingTopic;
  youtubeId: string;
  thumbnail?: string;
  featured?: boolean;
};

export const PARENT_TOPIC_LABELS: Record<ParentTrainingTopic | "all", string> = {
  all: "All",
  orientation: "Orientation",
  app_guide: "App guides",
  policy: "Policies",
};

export function youtubeEmbedUrl(youtubeId: string) {
  return `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`;
}

export function youtubeWatchUrl(youtubeId: string) {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

/** Offline fallback when ERP API is unreachable */
export const fallbackParentVideos: ParentTrainingVideo[] = [
  {
    id: "par-ori-1",
    title: "Welcome orientation for families",
    description: "Campus tour overview, daily schedule, and what to pack.",
    duration: "10:50",
    topic: "orientation",
    youtubeId: "M7lc1UVf-VE",
    thumbnail: "https://img.youtube.com/vi/M7lc1UVf-VE/hqdefault.jpg",
    featured: true,
  },
  {
    id: "par-ori-2",
    title: "First week tips for new families",
    description: "Separation anxiety, drop-off routines, and settling in.",
    duration: "6:40",
    topic: "orientation",
    youtubeId: "aqz-KE-bpKQ",
    thumbnail: "https://img.youtube.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
  },
  {
    id: "par-app-1",
    title: "Using the parent app — feed & photos",
    description: "How to follow daily updates, like moments, and message teachers.",
    duration: "5:15",
    topic: "app_guide",
    youtubeId: "ScMzIvxBSi4",
    thumbnail: "https://img.youtube.com/vi/ScMzIvxBSi4/hqdefault.jpg",
    featured: true,
  },
  {
    id: "par-app-2",
    title: "Paying fees in the parent portal",
    description: "Invoices, enrollment payment unlock, and receipt tips.",
    duration: "4:30",
    topic: "app_guide",
    youtubeId: "lXMskKTw3Bc",
    thumbnail: "https://img.youtube.com/vi/lXMskKTw3Bc/hqdefault.jpg",
  },
  {
    id: "par-pol-1",
    title: "Parent handbook — key policies",
    description: "Attendance, illness, pickup authorization, and communication.",
    duration: "12:10",
    topic: "policy",
    youtubeId: "eIho2S0ZahI",
    thumbnail: "https://img.youtube.com/vi/eIho2S0ZahI/hqdefault.jpg",
  },
  {
    id: "par-pol-2",
    title: "Privacy & photo sharing consent",
    description: "How we share classroom moments and your consent choices.",
    duration: "3:55",
    topic: "policy",
    youtubeId: "jNQXAC9IVRw",
    thumbnail: "https://img.youtube.com/vi/jNQXAC9IVRw/hqdefault.jpg",
  },
];

const ERP_API =
  process.env.NEXT_PUBLIC_ERP_API_URL?.replace(/\/$/, "") || "http://localhost:3000";

export async function fetchParentTrainingVideos(): Promise<ParentTrainingVideo[]> {
  try {
    const url = new URL(`${ERP_API}/api/training-videos`);
    url.searchParams.set("audience", "parents");
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return fallbackParentVideos;
    const data = (await res.json()) as { videos: ParentTrainingVideo[] };
    return data.videos?.length ? data.videos : fallbackParentVideos;
  } catch {
    return fallbackParentVideos;
  }
}
