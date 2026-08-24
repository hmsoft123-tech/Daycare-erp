import type { TrainingAssignment, TrainingCertificate } from "@/types";

/** New-hire / ongoing training assignments (demo) */
export const trainingAssignments: TrainingAssignment[] = [
  {
    id: "ta1",
    staffId: "st9",
    staffName: "Fatima Noor",
    branchId: "branch-nn",
    videoIds: ["st-ind-1", "st-pol-1", "st-saf-1", "st-sop-1"],
    assignedOn: "2026-08-01",
    dueOn: "2026-08-15",
    status: "in_progress",
    isNewHire: true,
  },
  {
    id: "ta2",
    staffId: "st2",
    staffName: "Nadia Farooq",
    branchId: "branch-clifton",
    videoIds: ["st-ind-1", "st-pol-1", "st-ece-1"],
    assignedOn: "2026-07-20",
    dueOn: "2026-08-05",
    status: "completed",
    isNewHire: true,
  },
  {
    id: "ta3",
    staffId: "st4",
    staffName: "Sana Javed",
    branchId: "branch-dha",
    videoIds: ["st-thr-1", "st-saf-1"],
    assignedOn: "2026-08-05",
    dueOn: "2026-08-20",
    status: "assigned",
    isNewHire: false,
  },
  {
    id: "ta4",
    staffId: "st6",
    staffName: "Ayesha Malik",
    branchId: "branch-gulshan",
    videoIds: ["st-ind-1", "st-pol-1", "st-cm-1", "st-pc-1"],
    assignedOn: "2026-07-10",
    dueOn: "2026-07-25",
    status: "overdue",
    isNewHire: true,
  },
];

export const trainingCertificatesIssued: TrainingCertificate[] = [
  {
    id: "cert1",
    staffName: "Nadia Farooq",
    moduleTitle: "Staff induction overview",
    issuedOn: "2026-08-04",
    certificateNo: "SDLC-TR-2026-0142",
  },
  {
    id: "cert2",
    staffName: "Nadia Farooq",
    moduleTitle: "Child protection & safeguarding policy",
    issuedOn: "2026-08-04",
    certificateNo: "SDLC-TR-2026-0143",
  },
];
