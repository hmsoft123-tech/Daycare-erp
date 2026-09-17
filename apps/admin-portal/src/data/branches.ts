import type { Branch } from "@/types";

export const branches: Branch[] = [
  {
    id: "branch-nn",
    name: "Nazimabad Campus",
    address: "Block B, North Nazimabad",
    city: "Karachi",
    headCount: 212,
    status: "healthy",
  },
  {
    id: "branch-clifton",
    name: "Johar Campus",
    address: "Gulistan-e-Johar",
    city: "Karachi",
    headCount: 198,
    status: "healthy",
  },
  {
    id: "branch-dha",
    name: "PECHS Campus",
    address: "PECHS Block 2",
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
  {
    id: "branch-north",
    name: "North Campus",
    address: "North Karachi",
    city: "Karachi",
    headCount: 150,
    status: "healthy",
  },
];

export const HEAD_OFFICE_ID = "head_office";
