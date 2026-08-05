export type ParentChild = {
  id: string;
  name: string;
  className: string;
  branch: string;
  ageLabel: string;
  status: "checked_in" | "absent" | "pickup";
  enrollmentStatus: "active" | "pending_first_payment";
  photoColor: string;
  initials: string;
  allergies: string[];
  teacher: string;
  checkInTime?: string;
};

export type FeedItem = {
  id: string;
  type: "meal" | "nap" | "activity" | "note" | "photo" | "checkin" | "checkout" | "potty" | "learning";
  title: string;
  body: string;
  time: string;
  childId: string;
  childName: string;
  imageUrl?: string;
  likes?: number;
  liked?: boolean;
};

export type ParentInvoice = {
  id: string;
  number: string;
  childName: string;
  childId: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  plan: string;
  isEnrollmentInvoice?: boolean;
};

export const mockChildren: ParentChild[] = [
  {
    id: "s1",
    name: "Hamdan Khan",
    className: "Infant Room A",
    branch: "North Nazimabad",
    ageLabel: "5 yrs",
    status: "checked_in",
    enrollmentStatus: "active",
    photoColor: "#FF6A3D",
    initials: "HK",
    allergies: ["Peanuts"],
    teacher: "Fatima Noor",
    checkInTime: "08:12 AM",
  },
  {
    id: "s2",
    name: "Zainab Siddiqui",
    className: "Playgroup B",
    branch: "Clifton",
    ageLabel: "4 yrs",
    status: "checked_in",
    enrollmentStatus: "active",
    photoColor: "#4C8BF5",
    initials: "ZS",
    allergies: [],
    teacher: "Nadia Farooq",
    checkInTime: "08:18 AM",
  },
  {
    id: "c3",
    name: "Zane Khan",
    className: "Infant Room A",
    branch: "North Nazimabad",
    ageLabel: "3 yrs",
    status: "absent",
    enrollmentStatus: "pending_first_payment",
    photoColor: "#F59E0B",
    initials: "ZK",
    allergies: [],
    teacher: "Fatima Noor",
  },
];

/** Fallback feed when ERP API is unreachable — ids align with admin student ids */
export const mockFeed: FeedItem[] = [
  {
    id: "act6",
    type: "photo",
    title: "Story time smiles",
    body: "Listening to The Very Hungry Caterpillar with friends.\n— Fatima Noor",
    time: "2:45 PM",
    childId: "s1",
    childName: "Hamdan",
    imageUrl:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=800&q=80",
    likes: 4,
    liked: false,
  },
  {
    id: "act2",
    type: "meal",
    title: "Lunch",
    body: "Ate most of lunch — rice, chicken, and yogurt. Drank water.\n— Fatima Noor",
    time: "12:40 PM",
    childId: "s1",
    childName: "Hamdan",
  },
  {
    id: "act5",
    type: "activity",
    title: "Outdoor play",
    body: "Enjoyed playground time and sand table.\n— Nadia Farooq",
    time: "11:00 AM",
    childId: "s2",
    childName: "Zainab",
  },
  {
    id: "act1",
    type: "checkin",
    title: "Checked in",
    body: "Arrived happily and joined morning circle.\n— Fatima Noor",
    time: "08:12 AM",
    childId: "s1",
    childName: "Hamdan",
  },
];

export const mockInvoices: ParentInvoice[] = [
  {
    id: "inv1",
    number: "INV-2025-0142",
    childName: "Hamdan Khan",
    childId: "s1",
    amount: 35000,
    dueDate: "2025-06-05",
    status: "paid",
    plan: "Full Day Monthly",
  },
  {
    id: "inv2",
    number: "INV-2026-0158",
    childName: "Zainab Siddiqui",
    childId: "s2",
    amount: 35000,
    dueDate: "2026-08-05",
    status: "pending",
    plan: "Playgroup — Plus",
  },
  {
    id: "inv-enroll",
    number: "INV-2026-8911",
    childName: "Zane Khan",
    childId: "c3",
    amount: 80000,
    dueDate: "2026-07-20",
    status: "pending",
    plan: "First Month Tuition + Registration",
    isEnrollmentInvoice: true,
  },
  {
    id: "inv3",
    number: "INV-2025-0120",
    childName: "Hamdan Khan",
    childId: "s1",
    amount: 5000,
    dueDate: "2025-05-15",
    status: "overdue",
    plan: "Activity Fee",
  },
];

export function formatPkr(amount: number) {
  return `PKR ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(amount)}`;
}
