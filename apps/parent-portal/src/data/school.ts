export type AttendanceStatus = "present" | "absent" | "late" | "leave";

export type AttendanceRecord = {
  id: string;
  childId: string;
  childName: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  note?: string;
};

export type HomeworkItem = {
  id: string;
  childId: string;
  childName: string;
  title: string;
  subject: string;
  assignedOn: string;
  dueOn: string;
  status: "pending" | "submitted" | "checked";
  instructions: string;
};

export type AssignmentItem = {
  id: string;
  childId: string;
  childName: string;
  title: string;
  subject: string;
  assignedOn: string;
  dueOn: string;
  status: "open" | "submitted" | "graded";
  marks?: string;
  brief: string;
};

export type ProgressReport = {
  id: string;
  childId: string;
  childName: string;
  term: string;
  className: string;
  issuedOn: string;
  overall: string;
  areas: { label: string; level: "emerging" | "developing" | "secure"; note: string }[];
  teacherComment: string;
};

export type NoticeItem = {
  id: string;
  title: string;
  body: string;
  date: string;
  audience: "all" | "branch" | "class";
  priority: "normal" | "important";
  childIds?: string[];
};

export type SyllabusTopic = {
  id: string;
  childId: string;
  childName: string;
  subject: string;
  unit: string;
  topics: string[];
  weekOf: string;
};

export const mockAttendance: AttendanceRecord[] = [
  { id: "at1", childId: "s1", childName: "Hamdan", date: "2026-08-10", status: "present", checkIn: "08:12 AM", checkOut: "01:05 PM" },
  { id: "at2", childId: "s1", childName: "Hamdan", date: "2026-08-09", status: "present", checkIn: "08:20 AM", checkOut: "01:00 PM" },
  { id: "at3", childId: "s1", childName: "Hamdan", date: "2026-08-08", status: "late", checkIn: "09:05 AM", checkOut: "01:10 PM", note: "Traffic delay" },
  { id: "at4", childId: "s1", childName: "Hamdan", date: "2026-08-07", status: "absent", note: "Family travel" },
  { id: "at5", childId: "s1", childName: "Hamdan", date: "2026-08-06", status: "present", checkIn: "08:15 AM", checkOut: "01:00 PM" },
  { id: "at6", childId: "s2", childName: "Zainab", date: "2026-08-10", status: "present", checkIn: "08:18 AM", checkOut: "12:45 PM" },
  { id: "at7", childId: "s2", childName: "Zainab", date: "2026-08-09", status: "present", checkIn: "08:10 AM", checkOut: "12:50 PM" },
  { id: "at8", childId: "s2", childName: "Zainab", date: "2026-08-08", status: "leave", note: "Medical appointment" },
  { id: "at9", childId: "s2", childName: "Zainab", date: "2026-08-07", status: "present", checkIn: "08:22 AM", checkOut: "12:55 PM" },
  { id: "at10", childId: "s2", childName: "Zainab", date: "2026-08-06", status: "late", checkIn: "08:48 AM", checkOut: "12:40 PM" },
  { id: "at11", childId: "s1", childName: "Hamdan", date: "2026-07-28", status: "present", checkIn: "08:10 AM", checkOut: "01:00 PM" },
  { id: "at12", childId: "s1", childName: "Hamdan", date: "2026-07-15", status: "absent", note: "Fever" },
  { id: "at13", childId: "s2", childName: "Zainab", date: "2026-07-28", status: "present", checkIn: "08:05 AM", checkOut: "12:50 PM" },
  { id: "at14", childId: "s2", childName: "Zainab", date: "2026-06-20", status: "late", checkIn: "08:55 AM", checkOut: "12:40 PM" },
  { id: "at15", childId: "s1", childName: "Hamdan", date: "2025-12-18", status: "present", checkIn: "08:14 AM", checkOut: "01:00 PM" },
  { id: "at16", childId: "s2", childName: "Zainab", date: "2025-12-18", status: "leave", note: "Family event" },
];

export const mockHomework: HomeworkItem[] = [
  {
    id: "hw1",
    childId: "s1",
    childName: "Hamdan",
    title: "Colour the shapes worksheet",
    subject: "Early Maths",
    assignedOn: "2026-08-10",
    dueOn: "2026-08-12",
    status: "pending",
    instructions: "Colour circles red and squares blue. Bring worksheet tomorrow.",
  },
  {
    id: "hw2",
    childId: "s1",
    childName: "Hamdan",
    title: "Read bedtime story page 1–2",
    subject: "Literacy",
    assignedOn: "2026-08-08",
    dueOn: "2026-08-10",
    status: "checked",
    instructions: "Parent initials on reading log please.",
  },
  {
    id: "hw3",
    childId: "s2",
    childName: "Zainab",
    title: "Practice writing letter A",
    subject: "Phonics",
    assignedOn: "2026-08-10",
    dueOn: "2026-08-13",
    status: "pending",
    instructions: "Trace 1 page in notebook. Use pencil grip reminder.",
  },
  {
    id: "hw4",
    childId: "s2",
    childName: "Zainab",
    title: "Nature walk photo share",
    subject: "EVS",
    assignedOn: "2026-08-07",
    dueOn: "2026-08-11",
    status: "submitted",
    instructions: "Upload one leaf/flower photo via parent app messages (or show teacher).",
  },
];

export const mockAssignments: AssignmentItem[] = [
  {
    id: "as1",
    childId: "s1",
    childName: "Hamdan",
    title: "My family collage",
    subject: "Art",
    assignedOn: "2026-08-05",
    dueOn: "2026-08-15",
    status: "open",
    brief: "Bring cut-outs or drawings of family members for class collage day.",
  },
  {
    id: "as2",
    childId: "s2",
    childName: "Zainab",
    title: "Counting objects 1–10",
    subject: "Maths",
    assignedOn: "2026-08-01",
    dueOn: "2026-08-09",
    status: "graded",
    marks: "Excellent",
    brief: "Count household items and draw them. Graded in class circle.",
  },
  {
    id: "as3",
    childId: "s2",
    childName: "Zainab",
    title: "Show & tell — favourite toy",
    subject: "Speaking",
    assignedOn: "2026-08-08",
    dueOn: "2026-08-14",
    status: "open",
    brief: "Prepare 2–3 sentences about a favourite toy for Friday show & tell.",
  },
];

export const mockProgressReports: ProgressReport[] = [
  {
    id: "pr1",
    childId: "s1",
    childName: "Hamdan Khan",
    term: "Term 1 · 2026",
    className: "Infant Room A",
    issuedOn: "2026-07-20",
    overall: "Settling well · Happy learner",
    areas: [
      { label: "Social / emotional", level: "developing", note: "Shares toys with prompts." },
      { label: "Language", level: "emerging", note: "Uses 2–3 word phrases." },
      { label: "Motor skills", level: "secure", note: "Confident on playground equipment." },
      { label: "Self-help", level: "developing", note: "Needs help with lunch tidy-up." },
    ],
    teacherComment: "Hamdan enjoys circle time and outdoor play. Continue reading aloud at home.",
  },
  {
    id: "pr2",
    childId: "s2",
    childName: "Zainab Siddiqui",
    term: "Term 1 · 2026",
    className: "Playgroup B",
    issuedOn: "2026-07-22",
    overall: "Strong progress",
    areas: [
      { label: "Phonics", level: "secure", note: "Recognises most letter sounds taught." },
      { label: "Numeracy", level: "developing", note: "Counts to 10 with support." },
      { label: "Fine motor", level: "developing", note: "Pencil grip improving." },
      { label: "Classroom routines", level: "secure", note: "Follows instructions independently." },
    ],
    teacherComment: "Zainab is a joyful participant. Extra tracing practice will help handwriting.",
  },
];

export const mockNotices: NoticeItem[] = [
  {
    id: "n1",
    title: "Independence Day celebration — 14 Aug",
    body: "Children may wear green & white. Short assembly at 9:00 AM. Parents welcome for photo moment at gate.",
    date: "2026-08-09",
    audience: "all",
    priority: "important",
  },
  {
    id: "n2",
    title: "Parent-teacher meeting slots open",
    body: "Book 10-minute PTM slots for 20–21 Aug via the front desk or WhatsApp broadcast reply.",
    date: "2026-08-08",
    audience: "all",
    priority: "normal",
  },
  {
    id: "n3",
    title: "Playgroup B — water play day",
    body: "Thursday: send spare clothes and towel labelled with child's name.",
    date: "2026-08-07",
    audience: "class",
    priority: "normal",
    childIds: ["s2"],
  },
  {
    id: "n4",
    title: "Fee challan reminder",
    body: "August challans are due by the printed due date. Late fee applies after due date.",
    date: "2026-08-05",
    audience: "all",
    priority: "important",
  },
];

export const mockSyllabus: SyllabusTopic[] = [
  {
    id: "sy1",
    childId: "s1",
    childName: "Hamdan",
    subject: "Theme",
    unit: "All about me",
    weekOf: "2026-08-11",
    topics: ["Body parts song", "My name puzzle", "Mirror play", "Family photos"],
  },
  {
    id: "sy2",
    childId: "s1",
    childName: "Hamdan",
    subject: "Sensory",
    unit: "Textures week",
    weekOf: "2026-08-04",
    topics: ["Sand table", "Soft vs hard", "Finger painting"],
  },
  {
    id: "sy3",
    childId: "s2",
    childName: "Zainab",
    subject: "Phonics",
    unit: "Letters A–D",
    weekOf: "2026-08-11",
    topics: ["Letter A sound", "Apple craft", "Letter B tracing", "Beginning sounds game"],
  },
  {
    id: "sy4",
    childId: "s2",
    childName: "Zainab",
    subject: "Maths",
    unit: "Numbers 1–5",
    weekOf: "2026-08-11",
    topics: ["Number rhyme", "Counting bears", "Match quantity to numeral"],
  },
];

export function formatSchoolDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
