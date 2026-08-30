export type MontessoriStage =
  | "Presented"
  | "Practising"
  | "Developing Independence"
  | "Independent";

export type MontessoriWork = {
  id: string;
  childId: string;
  area: string;
  material: string;
  stage: MontessoriStage;
  observation: string;
  updatedAt: string;
};

export type PortfolioItem = {
  id: string;
  childId: string;
  title: string;
  note: string;
  area: string;
  date: string;
};

export type GalleryItem = {
  id: string;
  childId: string;
  childName: string;
  caption: string;
  time: string;
  imageUrl: string;
};

export const montessoriWorks: MontessoriWork[] = [
  {
    id: "mw1",
    childId: "s1",
    area: "Practical Life",
    material: "Pouring water",
    stage: "Practising",
    observation: "Steady hand control; still spills on the return tray.",
    updatedAt: "Today",
  },
  {
    id: "mw2",
    childId: "s1",
    area: "Sensorial",
    material: "Pink Tower",
    stage: "Presented",
    observation: "First presentation completed with guide.",
    updatedAt: "Yesterday",
  },
  {
    id: "mw3",
    childId: "s2",
    area: "Language",
    material: "Sandpaper letters",
    stage: "Developing Independence",
    observation: "Traces m, a, t with confidence; beginning phonetic blending.",
    updatedAt: "Today",
  },
  {
    id: "mw4",
    childId: "s2",
    area: "Mathematics",
    material: "Number rods",
    stage: "Independent",
    observation: "Builds 1–10 sequence without prompt.",
    updatedAt: "2 days ago",
  },
];

export const portfolioItems: PortfolioItem[] = [
  {
    id: "pf1",
    childId: "s1",
    title: "Care of self — hand washing",
    note: "Evidence of independence after three weeks of practice.",
    area: "Practical Life",
    date: "Aug 28",
  },
  {
    id: "pf2",
    childId: "s2",
    title: "Phonetic booklet — mat",
    note: "Child built three-letter words with movable alphabet.",
    area: "Language",
    date: "Aug 27",
  },
];

export const galleryItems: GalleryItem[] = [
  {
    id: "g1",
    childId: "s1",
    childName: "Hamdan",
    caption: "Outdoor play · North Nazimabad",
    time: "10:20 AM",
    imageUrl: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80",
  },
  {
    id: "g2",
    childId: "s2",
    childName: "Zainab",
    caption: "Art corner collage",
    time: "11:05 AM",
    imageUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80",
  },
  {
    id: "g3",
    childId: "s1",
    childName: "Hamdan",
    caption: "Circle time smiles",
    time: "09:40 AM",
    imageUrl: "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800&q=80",
  },
];

export const familyMembers = [
  { id: "f1", name: "Fatima Khan", role: "Mother · Primary", phone: "0300-1234567", email: "fatima.khan@email.com" },
  { id: "f2", name: "Imran Khan", role: "Father", phone: "0301-7654321", email: "imran.khan@email.com" },
  { id: "f3", name: "Hassan Siddiqui", role: "Authorized pickup", phone: "0321-9876543", email: "—" },
];
