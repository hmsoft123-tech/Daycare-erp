import type { StaffInquiryCard, StaffInquiryStage, StaffInquiryTag, StaffRole } from "@/types";

const TAGS: StaffInquiryTag[] = [
  "hot_lead",
  "referral",
  "walk_in",
  "online",
  "campus_posting",
  "agency",
];

const ROLES: StaffRole[] = ["teacher", "therapist", "admin", "support", "accountant"];

const DESCRIPTIONS = [
  "Applied via public employment form — early childhood teaching.",
  "Referral from current staff; 3+ years preschool experience.",
  "Walk-in CV drop; interested in after-school program.",
  "Online lead for speech therapy part-time role.",
  "Campus posting response — admin / front desk.",
  "Agency shortlist candidate; awaiting branch interview.",
  "Strong demo lesson feedback from panel.",
  "Offer drafted — waiting on candidate acceptance.",
];

const stages: StaffInquiryStage[] = [
  "new_inquiry",
  "interview_scheduled",
  "offer_pending",
  "hired",
  "waitlist",
];

const base = [
  { id: "si1", name: "Amna Khalid", email: "amna.k@email.com", phone: "+92 300 2211001", experienceYears: 4 },
  { id: "si2", name: "Farhan Qureshi", email: "farhan.q@email.com", phone: "+92 321 3344556", experienceYears: 2 },
  { id: "si3", name: "Mehwish Raza", email: "mehwish.r@email.com", phone: "+92 333 7788990", experienceYears: 6 },
  { id: "si4", name: "Tariq Saleem", email: "tariq.s@email.com", phone: "+92 345 1122334", experienceYears: 1 },
  { id: "si5", name: "Sabeen Ali", email: "sabeen.a@email.com", phone: "+92 312 5566778", experienceYears: 5 },
  { id: "si6", name: "Imran Bhatti", email: "imran.b@email.com", phone: "+92 301 9988776", experienceYears: 3 },
  { id: "si7", name: "Hira Nadeem", email: "hira.n@email.com", phone: "+92 322 4455667", experienceYears: 8 },
  { id: "si8", name: "Osama Sheikh", email: "osama.s@email.com", phone: "+92 334 6677889", experienceYears: 2 },
  { id: "si9", name: "Zainab Fatima", email: "zainab.f@email.com", phone: "+92 300 1122445", experienceYears: 4 },
  { id: "si10", name: "Kamran Lodhi", email: "kamran.l@email.com", phone: "+92 321 7788990", experienceYears: 7 },
  { id: "si11", name: "Nida Shah", email: "nida.s@email.com", phone: "+92 333 5544332", experienceYears: 3 },
  { id: "si12", name: "Rehan Malik", email: "rehan.m@email.com", phone: "+92 345 8899001", experienceYears: 5 },
];

const BRANCHES = ["branch-nn", "branch-clifton", "branch-dha", "branch-gulshan"];

const stageOverrides: Record<string, StaffInquiryStage> = {
  si1: "new_inquiry",
  si2: "new_inquiry",
  si3: "interview_scheduled",
  si4: "interview_scheduled",
  si5: "offer_pending",
  si6: "offer_pending",
  si7: "hired",
  si8: "hired",
  si9: "waitlist",
  si10: "waitlist",
};

export const staffInquiries: StaffInquiryCard[] = base.map((person, i) => {
  const stage = stageOverrides[person.id] ?? stages[i % stages.length];
  const hour = 9 + (i % 8);
  const inquiryTime = `${String(hour).padStart(2, "0")}:${String((i * 11) % 60).padStart(2, "0")}`;

  const card: StaffInquiryCard = {
    ...person,
    role: ROLES[i % ROLES.length],
    branchId: BRANCHES[i % BRANCHES.length],
    stage,
    daysInStage: (i % 12) + 1,
    tag: TAGS[i % TAGS.length],
    description: DESCRIPTIONS[i % DESCRIPTIONS.length],
    inquiryTime,
    createdAt: `2025-0${(i % 6) + 1}-${String(10 + (i % 18)).padStart(2, "0")}`,
    avatar: `https://i.pravatar.cc/150?img=${30 + i}`,
  };

  if (stage === "interview_scheduled") {
    card.interviewKind = i % 2 === 0 ? "in_person" : "demo";
    card.interviewDate = "2026-07-22";
    card.interviewTime = "11:00";
    card.interviewLocation = "HR room · Main campus";
    card.interviewNotes = "Bring original certificates";
  }
  if (stage === "offer_pending" || stage === "hired") {
    card.offeredSalary = 45000 + i * 5000;
    card.joiningDate = "2026-08-01";
    card.employmentType = i % 3 === 0 ? "part_time" : "full_time";
    card.offerNotes = stage === "hired" ? "Accepted — onboarding scheduled." : "Offer emailed; awaiting reply.";
  }

  return card;
});
