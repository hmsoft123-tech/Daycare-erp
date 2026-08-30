/** Extended ops data — messaging, PTM, library, virtual class, ABC incidents, leave, payroll extras */

export type MessageThread = {
  id: string;
  /** Brightwheel-style audience bucket */
  audience: "parent" | "staff";
  parentId: string;
  parentName: string;
  withName: string;
  withRole: "teacher" | "admin" | "group" | "parent";
  childId?: string;
  childName?: string;
  roomName?: string;
  tags?: ("Admin" | "Parent" | "Teacher" | "Staff")[];
  preview: string;
  updatedAt: string;
  unread: number;
  messages: { id: string; from: "parent" | "staff"; body: string; at: string }[];
};

export type PtmSlot = {
  id: string;
  teacherName: string;
  branchId: string;
  date: string;
  time: string;
  status: "open" | "booked" | "done";
  parentName?: string;
  childName?: string;
};

export type AppNotification = {
  id: string;
  audience: "parent" | "staff" | "all";
  title: string;
  body: string;
  createdAt: string;
  type: "announcement" | "fee" | "incident" | "ptm" | "attendance" | "general";
  childId?: string;
  read?: boolean;
};

export type VirtualClass = {
  id: string;
  title: string;
  className: string;
  teacherName: string;
  provider: "zoom" | "meet" | "teams";
  joinUrl: string;
  startsAt: string;
  durationMin: number;
  childIds: string[];
  status: "upcoming" | "live" | "ended";
};

export type LibraryBook = {
  id: string;
  title: string;
  author: string;
  category: string;
  copies: number;
  available: number;
};

export type LibraryLoan = {
  id: string;
  bookId: string;
  bookTitle: string;
  childId: string;
  childName: string;
  issuedOn: string;
  dueOn: string;
  returnedOn?: string;
  status: "issued" | "overdue" | "returned";
};

export type AbcIncident = {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  time: string;
  activityArea: string;
  antecedent: string;
  behavior: string;
  consequence: string;
  firstResponder: string;
  verifier: string;
  firstAid?: string;
  minimizeIdeas: string[];
  branchId: string;
  notifiedParent: boolean;
  guardianRemarks?: string;
  status: "draft" | "submitted" | "parent_notified" | "closed";
};

export type LeaveRequest = {
  id: string;
  staffId: string;
  staffName: string;
  type: "annual" | "sick" | "casual" | "unpaid";
  from: string;
  to: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  balanceAfter?: number;
};

export type PayrollExtra = {
  id: string;
  kind: "pf" | "loan" | "advance" | "bonus" | "relief" | "increment";
  staffId: string;
  staffName: string;
  amount: number;
  note: string;
  effectiveMonth: string;
  status: "open" | "approved" | "closed";
  meta?: Record<string, string | number>;
};

export const messageThreads: MessageThread[] = [
  {
    id: "mt1",
    audience: "parent",
    parentId: "p1",
    parentName: "Ayesha Khan",
    withName: "Ayesha Khan",
    withRole: "parent",
    childId: "s1",
    childName: "Hamdan",
    roomName: "Infant Room A",
    tags: ["Parent"],
    preview: "Thank you! We’ll practice the song at home.",
    updatedAt: "2026-08-24T14:22:00",
    unread: 1,
    messages: [
      {
        id: "m1",
        from: "staff",
        body: "Hamdan had a wonderful story time today!",
        at: "2026-08-24T14:10:00",
      },
      {
        id: "m2",
        from: "parent",
        body: "Thank you! We’ll practice the song at home.",
        at: "2026-08-24T14:22:00",
      },
    ],
  },
  {
    id: "mt2",
    audience: "parent",
    parentId: "p3",
    parentName: "Omar Siddiqui",
    withName: "Omar Siddiqui",
    withRole: "parent",
    childId: "s2",
    childName: "Zainab",
    roomName: "Playgroup B",
    tags: ["Parent"],
    preview: "Can we reschedule pickup to 1:30?",
    updatedAt: "2026-08-24T11:05:00",
    unread: 1,
    messages: [
      {
        id: "m2a",
        from: "parent",
        body: "Can we reschedule pickup to 1:30?",
        at: "2026-08-24T11:05:00",
      },
    ],
  },
  {
    id: "mt3",
    audience: "parent",
    parentId: "p1",
    parentName: "Ayesha Khan",
    withName: "Front Desk",
    withRole: "admin",
    roomName: "All Rooms",
    tags: ["Admin", "Parent"],
    preview: "PTM slots for 20–21 Aug are open.",
    updatedAt: "2026-08-23T09:00:00",
    unread: 0,
    messages: [
      {
        id: "m3",
        from: "staff",
        body: "PTM slots for 20–21 Aug are open. Book from Messages → PTM.",
        at: "2026-08-23T09:00:00",
      },
    ],
  },
  {
    id: "mt4",
    audience: "staff",
    parentId: "staff-1",
    parentName: "Fatima Noor",
    withName: "Fatima Noor",
    withRole: "teacher",
    roomName: "Infant Room A",
    tags: ["Teacher", "Staff"],
    preview: "Ratio support needed after 12pm.",
    updatedAt: "2026-08-24T12:40:00",
    unread: 2,
    messages: [
      {
        id: "m4",
        from: "staff",
        body: "Ratio support needed after 12pm.",
        at: "2026-08-24T12:40:00",
      },
    ],
  },
  {
    id: "mt5",
    audience: "staff",
    parentId: "staff-2",
    parentName: "Nadia Farooq",
    withName: "Nadia Farooq",
    withRole: "teacher",
    roomName: "Playgroup B",
    tags: ["Teacher"],
    preview: "Menu change confirmed for Friday.",
    updatedAt: "2026-08-23T16:10:00",
    unread: 0,
    messages: [
      {
        id: "m5",
        from: "staff",
        body: "Menu change confirmed for Friday.",
        at: "2026-08-23T16:10:00",
      },
    ],
  },
];

export const ptmSlots: PtmSlot[] = [
  {
    id: "ptm1",
    teacherName: "Fatima Noor",
    branchId: "branch-nn",
    date: "2026-08-20",
    time: "09:00 AM",
    status: "open",
  },
  {
    id: "ptm2",
    teacherName: "Fatima Noor",
    branchId: "branch-nn",
    date: "2026-08-20",
    time: "09:15 AM",
    status: "booked",
    parentName: "Ayesha Khan",
    childName: "Hamdan",
  },
  {
    id: "ptm3",
    teacherName: "Nadia Farooq",
    branchId: "branch-clifton",
    date: "2026-08-21",
    time: "10:00 AM",
    status: "open",
  },
  {
    id: "ptm4",
    teacherName: "Nadia Farooq",
    branchId: "branch-clifton",
    date: "2026-08-21",
    time: "10:15 AM",
    status: "open",
  },
];

export const appNotifications: AppNotification[] = [
  {
    id: "n1",
    audience: "parent",
    title: "Late arrival noted",
    body: "Hamdan checked in late on 8 Aug. See School → Attendance.",
    createdAt: "2026-08-08T09:20:00",
    type: "attendance",
    childId: "s1",
  },
  {
    id: "n2",
    audience: "parent",
    title: "Fee challan ready",
    body: "August challan is available under Payments.",
    createdAt: "2026-08-05T11:00:00",
    type: "fee",
  },
  {
    id: "n3",
    audience: "parent",
    title: "PTM reminder",
    body: "Book your 10-minute slot for 20–21 Aug.",
    createdAt: "2026-08-18T08:00:00",
    type: "ptm",
  },
  {
    id: "n4",
    audience: "staff",
    title: "Induction overdue",
    body: "Ayesha Malik has overdue onboarding modules.",
    createdAt: "2026-08-10T10:00:00",
    type: "general",
  },
];

export const virtualClasses: VirtualClass[] = [
  {
    id: "vc1",
    title: "Circle time — colours",
    className: "Infant Room A",
    teacherName: "Fatima Noor",
    provider: "meet",
    joinUrl: "https://meet.google.com/abc-defg-hij",
    startsAt: "2026-08-25T10:00:00",
    durationMin: 30,
    childIds: ["s1"],
    status: "upcoming",
  },
  {
    id: "vc2",
    title: "Phonics A–D live",
    className: "Playgroup B",
    teacherName: "Nadia Farooq",
    provider: "zoom",
    joinUrl: "https://zoom.us/j/123456789",
    startsAt: "2026-08-24T11:00:00",
    durationMin: 40,
    childIds: ["s2"],
    status: "live",
  },
  {
    id: "vc3",
    title: "Parent orientation webinar",
    className: "All families",
    teacherName: "Center Head",
    provider: "teams",
    joinUrl: "https://teams.microsoft.com/l/meetup-join/demo",
    startsAt: "2026-08-22T17:00:00",
    durationMin: 45,
    childIds: ["s1", "s2"],
    status: "ended",
  },
];

export const libraryBooks: LibraryBook[] = [
  { id: "b1", title: "The Very Hungry Caterpillar", author: "Eric Carle", category: "Story", copies: 4, available: 2 },
  { id: "b2", title: "Brown Bear, Brown Bear", author: "Bill Martin Jr.", category: "Story", copies: 3, available: 1 },
  { id: "b3", title: "Alphablocks Reader 1", author: "SDLC", category: "Phonics", copies: 6, available: 5 },
  { id: "b4", title: "Counting Bears", author: "SDLC", category: "Maths", copies: 2, available: 0 },
];

export const libraryLoans: LibraryLoan[] = [
  {
    id: "l1",
    bookId: "b1",
    bookTitle: "The Very Hungry Caterpillar",
    childId: "s1",
    childName: "Hamdan",
    issuedOn: "2026-08-18",
    dueOn: "2026-08-25",
    status: "issued",
  },
  {
    id: "l2",
    bookId: "b2",
    bookTitle: "Brown Bear, Brown Bear",
    childId: "s2",
    childName: "Zainab",
    issuedOn: "2026-08-10",
    dueOn: "2026-08-17",
    status: "overdue",
  },
  {
    id: "l3",
    bookId: "b3",
    bookTitle: "Alphablocks Reader 1",
    childId: "s2",
    childName: "Zainab",
    issuedOn: "2026-08-01",
    dueOn: "2026-08-08",
    returnedOn: "2026-08-07",
    status: "returned",
  },
];

export const abcIncidents: AbcIncident[] = [
  {
    id: "inc1",
    studentId: "s1",
    studentName: "Hamdan Khan",
    date: "2026-08-12",
    time: "11:20 AM",
    activityArea: "Outdoor playground",
    antecedent: "Crowded slide queue; peer pushed ahead",
    behavior: "Fell on knee; cried briefly",
    consequence: "First aid cold pack; quiet corner; parent notified",
    firstResponder: "Fatima Noor",
    verifier: "Center Coordinator",
    firstAid: "Cold pack 10 min",
    minimizeIdeas: ["Stagger outdoor groups", "Spotter at slide"],
    branchId: "branch-nn",
    notifiedParent: true,
    status: "parent_notified",
  },
];

export const leaveRequests: LeaveRequest[] = [
  {
    id: "lv1",
    staffId: "st9",
    staffName: "Fatima Noor",
    type: "casual",
    from: "2026-08-28",
    to: "2026-08-28",
    days: 1,
    reason: "Family appointment",
    status: "pending",
    balanceAfter: 7,
  },
  {
    id: "lv2",
    staffId: "st2",
    staffName: "Nadia Farooq",
    type: "sick",
    from: "2026-08-15",
    to: "2026-08-16",
    days: 2,
    reason: "Fever",
    status: "approved",
    balanceAfter: 8,
  },
  {
    id: "lv3",
    staffId: "st4",
    staffName: "Sana Javed",
    type: "annual",
    from: "2026-09-01",
    to: "2026-09-05",
    days: 5,
    reason: "Travel",
    status: "pending",
  },
];

export const payrollExtras: PayrollExtra[] = [
  {
    id: "pe1",
    kind: "pf",
    staffId: "st9",
    staffName: "Fatima Noor",
    amount: 4500,
    note: "Employee + employer PF opening",
    effectiveMonth: "2026-08",
    status: "open",
    meta: { employeePf: 2250, employerPf: 2250 },
  },
  {
    id: "pe2",
    kind: "loan",
    staffId: "st2",
    staffName: "Nadia Farooq",
    amount: 50000,
    note: "Staff loan — 10 installments",
    effectiveMonth: "2026-07",
    status: "open",
    meta: { installments: 10, monthly: 5000, outstanding: 40000 },
  },
  {
    id: "pe3",
    kind: "advance",
    staffId: "st4",
    staffName: "Sana Javed",
    amount: 15000,
    note: "Salary advance Aug",
    effectiveMonth: "2026-08",
    status: "approved",
    meta: { deductionPlan: "2 months" },
  },
  {
    id: "pe4",
    kind: "bonus",
    staffId: "st9",
    staffName: "Fatima Noor",
    amount: 10000,
    note: "Performance bonus Q2",
    effectiveMonth: "2026-08",
    status: "approved",
  },
  {
    id: "pe5",
    kind: "increment",
    staffId: "st2",
    staffName: "Nadia Farooq",
    amount: 8,
    note: "Annual appraisal increment %",
    effectiveMonth: "2026-09",
    status: "open",
    meta: { newSalary: 72000 },
  },
  {
    id: "pe6",
    kind: "relief",
    staffId: "st6",
    staffName: "Ayesha Malik",
    amount: 3000,
    note: "Transport relief",
    effectiveMonth: "2026-08",
    status: "approved",
  },
];
