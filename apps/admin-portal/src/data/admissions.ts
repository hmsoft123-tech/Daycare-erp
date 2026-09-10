import type {
  AdmissionCard,
  AdmissionStage,
  AdmissionTag,
  InquirySource,
  InquiryType,
} from "@/types";

const TAGS: AdmissionTag[] = ["hot_lead", "walk_in", "referral", "sibling", "online", "campaign"];
const TYPES: InquiryType[] = ["admission", "tour", "general", "employment"];
const SOURCES: InquirySource[] = [
  "instagram",
  "facebook",
  "whatsapp",
  "website",
  "walk_in",
  "referral",
  "other",
];

const DESCRIPTIONS = [
  "Interested in full-time toddler care starting next month.",
  "Booked campus walkthrough and readiness assessment.",
  "Sibling of current student — requesting same branch.",
  "Waiting on classroom capacity; soft hold requested.",
  "Tuition agreed; invitation sent, first invoice unpaid.",
  "First invoice paid — ready for Day-1 roster activation.",
  "Parents prefer morning half-day schedule only.",
  "Applying for preschool; needs immunization documents.",
  "Employment interest submitted via public inquiry form.",
  "Online lead from campaigns — follow up within 24h.",
];

const EMAILS = [
  "kamran.ahmed@email.com",
  "saima.noor@email.com",
  "faisal.saleem@email.com",
  "ali.rizvi@email.com",
  "nabeel.iqbal@email.com",
  "tariq.mahmood@email.com",
  "imran.raza@email.com",
  "shahid.khan@email.com",
  "javed.ali@email.com",
  "waqas.tariq@email.com",
];

const stages: AdmissionStage[] = [
  "new_inquiry",
  "waitlist",
  "meeting_test_scheduled",
  "pending_ho_fee",
  "enrol_unpaid",
  "paid",
];

const cardData: Omit<AdmissionCard, "stage" | "tag" | "type" | "description" | "email" | "inquiryTime">[] = [
  { id: "a1", studentName: "Yusuf Ahmed", age: 3, parentName: "Kamran Ahmed", program: "Daycare", branchId: "branch-nn", daysInStage: 2, avatar: "https://i.pravatar.cc/150?img=52", createdAt: "2025-06-20", parentPhone: "+92 300 1110001", parentCnic: "42101-1234567-1", childDob: "2022-04-12", followUpStatus: "welcome_sent", welcomeSentAt: "2025-06-20" },
  { id: "a2", studentName: "Mariam Noor", age: 4, parentName: "Saima Noor", program: "Preschool", branchId: "branch-clifton", daysInStage: 5, avatar: "https://i.pravatar.cc/150?img=53", createdAt: "2025-06-17", parentCnic: "42101-7654321-2", childDob: "2021-08-03", followUpStatus: "post_meeting" },
  { id: "a3", studentName: "Arham Saleem", age: 2, parentName: "Faisal Saleem", program: "Daycare", branchId: "branch-dha", daysInStage: 1, avatar: "https://i.pravatar.cc/150?img=54", createdAt: "2025-06-23", parentPhone: "+92 300 2223344", parentCnic: "42201-9988776-3", childDob: "2023-11-01", followUpStatus: "welcome_sent" },
  { id: "a4", studentName: "Hania Rizvi", age: 5, parentName: "Ali Rizvi", program: "Kindergarten", branchId: "branch-gulshan", daysInStage: 8, avatar: "https://i.pravatar.cc/150?img=55", createdAt: "2025-06-14", parentCnic: "42101-5566778-4", childDob: "2020-02-20", followUpStatus: "post_meeting" },
  { id: "a5", studentName: "Rayyan Iqbal", age: 3, parentName: "Nabeel Iqbal", program: "Daycare", branchId: "branch-nn", daysInStage: 3, avatar: "https://i.pravatar.cc/150?img=56", createdAt: "2025-06-19", parentCnic: "42101-1122334-5", childDob: "2022-09-15" },
  { id: "a6", studentName: "Zara Mahmood", age: 4, parentName: "Tariq Mahmood", program: "Preschool", branchId: "branch-clifton", daysInStage: 4, avatar: "https://i.pravatar.cc/150?img=57", createdAt: "2025-06-10", classroom: "Preschool A", monthlyTuition: 80000, registrationFee: 0, invoiceNumber: "INV-2026-8801", parentCnic: "42201-3344556-6", childDob: "2021-05-08" },
  { id: "a7", studentName: "Ahmed Raza", age: 2, parentName: "Imran Raza", program: "Daycare", branchId: "branch-dha", daysInStage: 6, avatar: "https://i.pravatar.cc/150?img=58", createdAt: "2025-06-16", followUpOutcome: "admission_done", followUpStatus: "final" },
  { id: "a8", studentName: "Laiba Khan", age: 5, parentName: "Shahid Khan", program: "After School", branchId: "branch-gulshan", daysInStage: 4, avatar: "https://i.pravatar.cc/150?img=59", createdAt: "2025-06-18", followUpStatus: "final", followUpOutcome: "admission_done" },
  { id: "a9", studentName: "Mustafa Ali", age: 3, parentName: "Javed Ali", program: "Daycare", branchId: "branch-nn", daysInStage: 15, avatar: "https://i.pravatar.cc/150?img=60", createdAt: "2025-06-07", parentCnic: "42101-7788990-7", followUpStatus: "post_meeting", followUpNotes: "Capacity hold — prefer morning slot" },
  { id: "a10", studentName: "Ayesha Tariq", age: 4, parentName: "Waqas Tariq", program: "Preschool", branchId: "branch-clifton", daysInStage: 7, avatar: "https://i.pravatar.cc/150?img=61", createdAt: "2025-06-15" },
  { id: "a11", studentName: "Daniyal Shah", age: 2, parentName: "Asad Shah", program: "Daycare", branchId: "branch-dha", daysInStage: 10, avatar: "https://i.pravatar.cc/150?img=62", createdAt: "2025-06-12" },
  { id: "a12", studentName: "Noor Fatima", age: 5, parentName: "Hamza Fatima", program: "Kindergarten", branchId: "branch-gulshan", daysInStage: 3, avatar: "https://i.pravatar.cc/150?img=63", createdAt: "2025-06-02", classroom: "Kindergarten A", monthlyTuition: 85000, invoiceNumber: "INV-2026-8802" },
  { id: "a13", studentName: "Hassan Mir", age: 3, parentName: "Adnan Mir", program: "Daycare", branchId: "branch-nn", daysInStage: 9, avatar: "https://i.pravatar.cc/150?img=64", createdAt: "2025-06-13" },
  { id: "a14", studentName: "Sana Qureshi", age: 4, parentName: "Farhan Qureshi", program: "Preschool", branchId: "branch-clifton", daysInStage: 14, avatar: "https://i.pravatar.cc/150?img=65", createdAt: "2025-06-08", followUpStatus: "final", followUpOutcome: "deferred", followUpNotes: "Deferred to next session" },
  { id: "a15", studentName: "Bilal Hassan", age: 2, parentName: "Rizwan Hassan", program: "Daycare", branchId: "branch-dha", daysInStage: 11, avatar: "https://i.pravatar.cc/150?img=66", createdAt: "2025-06-11" },
  { id: "a16", studentName: "Mehreen Akhtar", age: 5, parentName: "Salman Akhtar", program: "After School", branchId: "branch-gulshan", daysInStage: 18, avatar: "https://i.pravatar.cc/150?img=67", createdAt: "2025-06-04" },
  { id: "a17", studentName: "Saad Javed", age: 3, parentName: "Khalid Javed", program: "Daycare", branchId: "branch-nn", daysInStage: 25, avatar: "https://i.pravatar.cc/150?img=68", createdAt: "2025-05-28" },
  { id: "a18", studentName: "Rabia Siddiqui", age: 4, parentName: "Munir Siddiqui", program: "Preschool", branchId: "branch-clifton", daysInStage: 30, avatar: "https://i.pravatar.cc/150?img=69", createdAt: "2025-05-23" },
  { id: "a19", studentName: "Talha Butt", age: 2, parentName: "Nadeem Butt", program: "Daycare", branchId: "branch-dha", daysInStage: 22, avatar: "https://i.pravatar.cc/150?img=70", createdAt: "2025-05-31" },
  { id: "a20", studentName: "Khadija Anwar", age: 5, parentName: "Yasir Anwar", program: "Kindergarten", branchId: "branch-gulshan", daysInStage: 35, avatar: "https://i.pravatar.cc/150?img=71", createdAt: "2025-05-18" },
  { id: "a21", studentName: "Fahad Malik", age: 3, parentName: "Tahir Malik", program: "Daycare", branchId: "branch-nn", daysInStage: 40, avatar: "https://i.pravatar.cc/150?img=72", createdAt: "2025-05-13" },
  { id: "a22", studentName: "Amna Zafar", age: 4, parentName: "Rehan Zafar", program: "Preschool", branchId: "branch-clifton", daysInStage: 45, avatar: "https://i.pravatar.cc/150?img=73", createdAt: "2025-05-08" },
  { id: "a23", studentName: "Usama Farooq", age: 2, parentName: "Shoaib Farooq", program: "Daycare", branchId: "branch-dha", daysInStage: 50, avatar: "https://i.pravatar.cc/150?img=74", createdAt: "2025-05-03" },
  { id: "a24", studentName: "Hira Bashir", age: 5, parentName: "Junaid Bashir", program: "After School", branchId: "branch-gulshan", daysInStage: 55, avatar: "https://i.pravatar.cc/150?img=75", createdAt: "2025-04-28" },
  { id: "a25", studentName: "Ali Haider", age: 3, parentName: "Waseem Haider", program: "Daycare", branchId: "branch-nn", daysInStage: 60, avatar: "https://i.pravatar.cc/150?img=76", createdAt: "2025-04-23" },
  { id: "a26", studentName: "Saima Iqbal", age: 4, parentName: "Noman Iqbal", program: "Preschool", branchId: "branch-clifton", daysInStage: 3, avatar: "https://i.pravatar.cc/150?img=77", createdAt: "2025-06-21" },
  { id: "a27", studentName: "Zaid Ahmed", age: 2, parentName: "Bilal Ahmed", program: "Daycare", branchId: "branch-dha", daysInStage: 7, avatar: "https://i.pravatar.cc/150?img=78", createdAt: "2025-06-17" },
  { id: "a28", studentName: "Areeba Khan", age: 5, parentName: "Shahbaz Khan", program: "Kindergarten", branchId: "branch-gulshan", daysInStage: 16, avatar: "https://i.pravatar.cc/150?img=79", createdAt: "2025-06-06", classroom: "Kindergarten A", monthlyTuition: 90000, invoiceNumber: "INV-2026-8911" },
  { id: "a29", studentName: "Hamza Sheikh", age: 3, parentName: "Arif Sheikh", program: "Daycare", branchId: "branch-nn", daysInStage: 13, avatar: "https://i.pravatar.cc/150?img=80", createdAt: "2025-06-09" },
  { id: "a30", studentName: "Nida Raza", age: 4, parentName: "Kamran Raza", program: "Preschool", branchId: "branch-clifton", daysInStage: 19, avatar: "https://i.pravatar.cc/150?img=81", createdAt: "2025-06-03" },
];

const stageOverrides: Record<string, AdmissionStage> = {
  a1: "new_inquiry",
  a2: "new_inquiry",
  a3: "meeting_test_scheduled",
  a4: "meeting_test_scheduled",
  a5: "meeting_test_scheduled",
  a6: "pending_ho_fee",
  a12: "enrol_unpaid",
  a28: "enrol_unpaid",
  a7: "paid",
  a8: "paid",
  a10: "paid",
  a9: "waitlist",
  a11: "waitlist",
  a14: "waitlist",
};

export const admissions: AdmissionCard[] = cardData.map((card, i) => {
  const type = TYPES[i % TYPES.length];
  const tag = TAGS[i % TAGS.length];
  const email = EMAILS[i % EMAILS.length];
  const description = DESCRIPTIONS[i % DESCRIPTIONS.length];
  const hour = 8 + (i % 10);
  const minute = (i * 7) % 60;
  const inquiryTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const stage = stageOverrides[card.id] ?? stages[i % stages.length];
  const inquirySource = SOURCES[i % SOURCES.length];

  const extras: Partial<AdmissionCard> = {};
  if (stage === "meeting_test_scheduled") {
    extras.meetingKind = i % 2 === 0 ? "tour" : "test";
    extras.meetingDate = "2026-07-20";
    extras.meetingTime = "10:30";
    extras.meetingLocation = "Front office · Campus tour desk";
    extras.meetingNotes = "Bring child for classroom visit";
  }
  if (stage === "enrol_unpaid" || stage === "paid" || stage === "pending_ho_fee") {
    extras.monthlyTuition = card.monthlyTuition ?? 80000;
    extras.admissionFee = card.registrationFee ?? (i % 3 === 0 ? 0 : 5000);
    extras.discountType = i % 4 === 0 ? "sibling" : i % 5 === 0 ? "percent" : "none";
    extras.discountValue = extras.discountType === "percent" ? 10 : extras.discountType === "sibling" ? 5000 : 0;
    extras.feeNotes =
      stage === "pending_ho_fee"
        ? "Awaiting Head Office fee-lock approval before enrol unpaid."
        : extras.discountType === "sibling"
          ? "Sibling discount applied; registration as agreed."
          : extras.admissionFee === 0
            ? "Admission fee waived for early commitment."
            : "Standard fee plan.";
  }

  return {
    ...card,
    ...extras,
    stage,
    tag,
    type,
    description,
    email,
    inquiryTime,
    inquiryType: type,
    parentEmail: email,
    inquirySource: card.inquirySource ?? inquirySource,
    followUpStatus:
      card.followUpStatus ??
      (stage === "new_inquiry" ? "welcome_sent" : stage === "waitlist" ? "post_meeting" : undefined),
  };
});
