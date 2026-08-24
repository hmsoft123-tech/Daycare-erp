import type { ParentTrainingTopic, StaffTrainingTopic, TrainingTopic } from "@/types";

/** SDLC Training Hub categories (expandable) */
export const STAFF_TOPIC_LABELS: Record<StaffTrainingTopic, string> = {
  induction: "Staff orientation / new staff",
  montessori: "Montessori training",
  ece: "Early childhood education",
  daycare: "Daycare training",
  classroom_mgmt: "Classroom management",
  professional_dev: "Professional development",
  policy: "School policies",
  sop: "SOPs",
  safety: "Safety & emergency",
  parent_comms: "Communication & parent handling",
  activity: "Activity guidance",
  therapy: "Therapy support",
};

export const PARENT_TOPIC_LABELS: Record<ParentTrainingTopic, string> = {
  orientation: "Orientation tutorials",
  app_guide: "App usage guides",
  policy: "Policy explainers",
  learning: "Learning at home",
};

export function topicLabel(topic: TrainingTopic, audience: "staff" | "parents"): string {
  if (audience === "staff") {
    return STAFF_TOPIC_LABELS[topic as StaffTrainingTopic] ?? topic;
  }
  return PARENT_TOPIC_LABELS[topic as ParentTrainingTopic] ?? topic;
}
