import type { TrainingVideo } from "@/types";

/** YouTube thumbnail helper */
export function youtubeThumb(youtubeId: string) {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function youtubeWatchUrl(youtubeId: string) {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

export function youtubeEmbedUrl(youtubeId: string) {
  return `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`;
}

/**
 * Training & Induction Video Hub catalog (YouTube-linked).
 * IDs are public YouTube videos suitable for demo embeds.
 */
const catalog: TrainingVideo[] = [
  // ——— Staff: Induction ———
  {
    id: "st-ind-1",
    title: "Staff induction overview",
    description: "Welcome to SDLC — campus routines, roles, and Day-1 checklist.",
    duration: "12:40",
    audience: "staff",
    topic: "induction",
    youtubeId: "M7lc1UVf-VE",
    category: "all",
    featured: true,
    active: true,
  },
  {
    id: "st-ind-2",
    title: "Classroom setup & arrival flow",
    description: "How teachers prepare rooms, greet families, and start the morning circle.",
    duration: "8:15",
    audience: "staff",
    topic: "induction",
    youtubeId: "aqz-KE-bpKQ",
    category: "teachers",
    active: true,
  },
  // ——— Staff: Policy ———
  {
    id: "st-pol-1",
    title: "Child protection & safeguarding policy",
    description: "Mandatory reporting, supervision ratios, and visitor protocols.",
    duration: "15:20",
    audience: "staff",
    topic: "policy",
    youtubeId: "ScMzIvxBSi4",
    category: "all",
    featured: true,
    active: true,
  },
  {
    id: "st-pol-2",
    title: "Hygiene & infection control",
    description: "Handwashing, cleaning schedules, and illness exclusion rules.",
    duration: "9:45",
    audience: "staff",
    topic: "policy",
    youtubeId: "lXMskKTw3Bc",
    category: "all",
    active: true,
  },
  // ——— Staff: Activity guidance ———
  {
    id: "st-act-1",
    title: "Circle time & story guidance",
    description: "Age-appropriate group activities and engagement tips.",
    duration: "11:05",
    audience: "staff",
    topic: "activity",
    youtubeId: "eIho2S0ZahI",
    category: "teachers",
    active: true,
  },
  {
    id: "st-act-2",
    title: "Outdoor play supervision",
    description: "Safe playground facilitation and inclusive play ideas.",
    duration: "7:30",
    audience: "staff",
    topic: "activity",
    youtubeId: "jNQXAC9IVRw",
    category: "teachers",
    active: true,
  },
  // ——— Staff: Safety / therapy extras ———
  {
    id: "st-saf-1",
    title: "First aid basics for childcare",
    description: "Emergency response overview for campus staff.",
    duration: "14:00",
    audience: "staff",
    topic: "safety",
    youtubeId: "hizBdM1q05A",
    category: "all",
    active: true,
  },
  {
    id: "st-thr-1",
    title: "ABA support in the classroom",
    description: "Therapist collaboration and simple reinforcement strategies.",
    duration: "18:25",
    audience: "staff",
    topic: "therapy",
    youtubeId: "fJ9rUzIMcZQ",
    category: "therapists",
    active: true,
  },

  // ——— Parents: Orientation ———
  {
    id: "par-ori-1",
    title: "Welcome orientation for families",
    description: "Campus tour overview, daily schedule, and what to pack.",
    duration: "10:50",
    audience: "parents",
    topic: "orientation",
    youtubeId: "M7lc1UVf-VE",
    category: "all",
    featured: true,
    active: true,
  },
  {
    id: "par-ori-2",
    title: "First week tips for new families",
    description: "Separation anxiety, drop-off routines, and settling in.",
    duration: "6:40",
    audience: "parents",
    topic: "orientation",
    youtubeId: "aqz-KE-bpKQ",
    category: "all",
    active: true,
  },
  // ——— Parents: App guides ———
  {
    id: "par-app-1",
    title: "Using the parent app — feed & photos",
    description: "How to follow daily updates, like moments, and message teachers.",
    duration: "5:15",
    audience: "parents",
    topic: "app_guide",
    youtubeId: "ScMzIvxBSi4",
    category: "all",
    featured: true,
    active: true,
  },
  {
    id: "par-app-2",
    title: "Paying fees in the parent portal",
    description: "Invoices, enrollment payment unlock, and receipt tips.",
    duration: "4:30",
    audience: "parents",
    topic: "app_guide",
    youtubeId: "lXMskKTw3Bc",
    category: "all",
    active: true,
  },
  // ——— Parents: Policy ———
  {
    id: "par-pol-1",
    title: "Parent handbook — key policies",
    description: "Attendance, illness, pickup authorization, and communication.",
    duration: "12:10",
    audience: "parents",
    topic: "policy",
    youtubeId: "eIho2S0ZahI",
    category: "all",
    active: true,
  },
  {
    id: "par-pol-2",
    title: "Privacy & photo sharing consent",
    description: "How we share classroom moments and your consent choices.",
    duration: "3:55",
    audience: "parents",
    topic: "policy",
    youtubeId: "jNQXAC9IVRw",
    category: "all",
    active: true,
  },
];

export const trainingVideos: TrainingVideo[] = catalog.map((v) => ({
  ...v,
  thumbnail: v.thumbnail ?? youtubeThumb(v.youtubeId),
  progress: v.progress ?? 0,
}));
