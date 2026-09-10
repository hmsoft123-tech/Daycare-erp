export type MaintenanceCategoryId =
  | "ac"
  | "cctv"
  | "printer"
  | "electrical"
  | "plumbing"
  | "generator_ups"
  | "it"
  | "furniture"
  | "building";

export type MaintenanceStatus = "scheduled" | "in_progress" | "completed" | "deferred";

export const MAINTENANCE_CATEGORIES: { id: MaintenanceCategoryId; label: string }[] = [
  { id: "ac", label: "AC Maintenance" },
  { id: "cctv", label: "CCTV Maintenance" },
  { id: "printer", label: "Printer Maintenance" },
  { id: "electrical", label: "Electrical Maintenance" },
  { id: "plumbing", label: "Plumbing Maintenance" },
  { id: "generator_ups", label: "Generator / UPS" },
  { id: "it", label: "IT / Computer" },
  { id: "furniture", label: "Furniture & Equipment" },
  { id: "building", label: "General Building" },
];

export type MaintenanceRecord = {
  id: string;
  branchId: string;
  category: MaintenanceCategoryId;
  vendor: string;
  visitDate: string;
  issue: string;
  workPerformed: string;
  partsUsed?: string;
  invoiceRef?: string;
  nextServiceDate?: string;
  status: MaintenanceStatus;
  remarks?: string;
};

export const maintenanceRecords: MaintenanceRecord[] = [
  {
    id: "mnt-1",
    branchId: "branch-nn",
    category: "ac",
    vendor: "CoolAir Services",
    visitDate: "2026-08-12",
    issue: "Classroom AC not cooling",
    workPerformed: "Gas top-up + filter clean",
    partsUsed: "R32 gas",
    invoiceRef: "INV-AC-441",
    nextServiceDate: "2026-11-12",
    status: "completed",
  },
  {
    id: "mnt-2",
    branchId: "branch-clifton",
    category: "cctv",
    vendor: "SecureVision PK",
    visitDate: "2026-08-20",
    issue: "Lobby camera offline",
    workPerformed: "Replaced PoE injector",
    partsUsed: "PoE injector",
    invoiceRef: "SV-992",
    nextServiceDate: "2026-12-01",
    status: "completed",
  },
  {
    id: "mnt-3",
    branchId: "branch-dha",
    category: "plumbing",
    vendor: "Karachi Plumb Co.",
    visitDate: "2026-09-02",
    issue: "Toddler washroom leak",
    workPerformed: "Valve replacement scheduled",
    status: "scheduled",
    nextServiceDate: "2026-09-05",
  },
  {
    id: "mnt-4",
    branchId: "branch-gulshan",
    category: "generator_ups",
    vendor: "PowerKeep",
    visitDate: "2026-07-28",
    issue: "UPS battery warning",
    workPerformed: "Battery bank test + firmware",
    invoiceRef: "PK-118",
    nextServiceDate: "2027-01-28",
    status: "completed",
    remarks: "Recommend battery replace in Q1",
  },
  {
    id: "mnt-5",
    branchId: "branch-nn",
    category: "it",
    vendor: "ByteFix",
    visitDate: "2026-09-01",
    issue: "Admin PC slow boot",
    workPerformed: "SSD health check in progress",
    status: "in_progress",
  },
];
