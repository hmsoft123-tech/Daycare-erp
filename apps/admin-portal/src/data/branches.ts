import type { Branch } from "@/types";

export const branches: Branch[] = [
  {
    id: "branch-nn",
    name: "North Nazimabad Campus",
    address: "Block B, North Nazimabad",
    city: "Karachi",
    headCount: 212,
    status: "healthy",
  },
  {
    id: "branch-clifton",
    name: "Clifton Campus",
    address: "Khayaban-e-Shamsheer, Clifton",
    city: "Karachi",
    headCount: 198,
    status: "healthy",
  },
  {
    id: "branch-dha",
    name: "DHA Campus",
    address: "Phase 6, DHA",
    city: "Karachi",
    headCount: 245,
    status: "attention",
  },
  {
    id: "branch-gulshan",
    name: "Gulshan Campus",
    address: "Block 7, Gulshan-e-Iqbal",
    city: "Karachi",
    headCount: 192,
    status: "healthy",
  },
];

export const HEAD_OFFICE_ID = "head_office";
