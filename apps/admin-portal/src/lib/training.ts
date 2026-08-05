import type { ParentTrainingTopic, StaffTrainingTopic, TrainingTopic } from "@/types";

export const STAFF_TOPIC_LABELS: Record<StaffTrainingTopic, string> = {
  induction: "Induction tutorials",
  policy: "Policy explainers",
  activity: "Activity guidance",
  safety: "Safety",
  therapy: "Therapy",
};

export const PARENT_TOPIC_LABELS: Record<ParentTrainingTopic, string> = {
  orientation: "Orientation tutorials",
  app_guide: "App usage guides",
  policy: "Policy explainers",
};

export function topicLabel(topic: TrainingTopic, audience: "staff" | "parents"): string {
  if (audience === "staff") {
    return STAFF_TOPIC_LABELS[topic as StaffTrainingTopic] ?? topic;
  }
  return PARENT_TOPIC_LABELS[topic as ParentTrainingTopic] ?? topic;
}
