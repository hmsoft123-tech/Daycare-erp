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
    id: "c1",
    name: "Hamdan Khan",
    className: "Toddler Room A",
    branch: "North Nazimabad",
    ageLabel: "3 yrs",
    status: "checked_in",
    enrollmentStatus: "active",
    photoColor: "#FF6A3D",
    initials: "HK",
    allergies: ["Peanuts"],
    teacher: "Nadia Farooq",
    checkInTime: "08:12 AM",
  },
  {
    id: "c2",
    name: "Omar Ahmed",
    className: "Toddler Room A",
    branch: "North Nazimabad",
    ageLabel: "2 yrs",
    status: "checked_in",
    enrollmentStatus: "active",
    photoColor: "#4C8BF5",
    initials: "OA",
    allergies: [],
    teacher: "Nadia Farooq",
    checkInTime: "08:18 AM",
  },
  {
    id: "c3",
    name: "Zane Khan",
    className: "Toddler Section A",
    branch: "North Nazimabad",
    ageLabel: "3 yrs",
    status: "absent",
    enrollmentStatus: "pending_first_payment",
    photoColor: "#F59E0B",
    initials: "ZK",
    allergies: [],
    teacher: "Nadia Farooq",
  },
];

export const mockFeed: FeedItem[] = [
  {
    id: "f1",
    type: "photo",
    title: "Story time smiles",
    body: "Listening to The Very Hungry Caterpillar with friends.",
    time: "2:45 PM",
    childId: "c1",
    childName: "Hamdan",
    imageUrl:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=800&q=80",
    likes: 4,
    liked: false,
  },
  {
    id: "f2",
    type: "meal",
    title: "Lunch",
    body: "Ate most of lunch — rice, chicken, and yogurt. Drank water.",
    time: "12:40 PM",
    childId: "c1",
    childName: "Hamdan",
  },
  {
    id: "f3",
    type: "nap",
    title: "Nap",
    body: "Slept peacefully for 45 minutes.",
    time: "1:30 PM",
    childId: "c2",
    childName: "Omar",
  },
  {
    id: "f4",
    type: "photo",
    title: "Outdoor play",
    body: "Climbing and laughing on the playground.",
    time: "11:20 AM",
    childId: "c2",
    childName: "Omar",
    imageUrl:
      "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=800&q=80",
    likes: 6,
    liked: true,
  },
  {
    id: "f5",
    type: "learning",
    title: "Learning moment",
    body: "Practiced color sorting — sorted greens and yellows independently.",
    time: "10:50 AM",
    childId: "c1",
    childName: "Hamdan",
  },
  {
    id: "f6",
    type: "activity",
    title: "Art circle",
    body: "Finger painting with primary colors.",
    time: "10:15 AM",
    childId: "c1",
    childName: "Hamdan",
  },
  {
    id: "f7",
    type: "potty",
    title: "Diaper change",
    body: "Wet · Changed successfully.",
    time: "9:40 AM",
    childId: "c2",
    childName: "Omar",
  },
  {
    id: "f8",
    type: "checkin",
    title: "Checked in",
    body: "Signed in by Fatima Khan",
    time: "08:12 AM",
    childId: "c1",
    childName: "Hamdan",
  },
  {
    id: "f9",
    type: "checkin",
    title: "Checked in",
    body: "Signed in by Fatima Khan",
    time: "08:18 AM",
    childId: "c2",
    childName: "Omar",
  },
  {
    id: "f10",
    type: "note",
    title: "Teacher note",
    body: "Please pack an extra set of clothes for tomorrow.",
    time: "9:05 AM",
    childId: "c2",
    childName: "Omar",
  },
];

export const mockInvoices: ParentInvoice[] = [
  {
    id: "inv1",
    number: "INV-2025-0142",
    childName: "Hamdan Khan",
    childId: "c1",
    amount: 35000,
    dueDate: "2025-06-05",
    status: "paid",
    plan: "Full Day Monthly",
  },
  {
    id: "inv2",
    number: "INV-2025-0158",
    childName: "Omar Ahmed",
    childId: "c2",
    amount: 35000,
    dueDate: "2025-07-05",
    status: "pending",
    plan: "Full Day Monthly",
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
    childId: "c1",
    amount: 5000,
    dueDate: "2025-05-15",
    status: "overdue",
    plan: "Activity Fee",
  },
];

export function formatPkr(amount: number) {
  return `PKR ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(amount)}`;
}
