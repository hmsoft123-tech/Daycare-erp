export type ParentAccountStatus = "active" | "pending" | "inactive";

export type ParentAccount = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: ParentAccountStatus;
  branchId: string;
  childrenNames: string[];
  portalAccess: boolean;
  lastLogin?: string;
  createdAt: string;
};

export const parentAccounts: ParentAccount[] = [
  {
    id: "par-001",
    name: "Fatima Khan",
    email: "fatima.khan@email.com",
    phone: "+92 321 7654321",
    status: "active",
    branchId: "branch-nn",
    childrenNames: ["Hamdan Khan", "Omar Ahmed"],
    portalAccess: true,
    lastLogin: "2025-07-14",
    createdAt: "2024-01-10",
  },
  {
    id: "par-002",
    name: "Ahmed Khan",
    email: "ahmed.khan@email.com",
    phone: "+92 300 1234567",
    status: "active",
    branchId: "branch-nn",
    childrenNames: ["Hamdan Khan"],
    portalAccess: true,
    lastLogin: "2025-07-12",
    createdAt: "2024-01-10",
  },
  {
    id: "par-003",
    name: "Aisha Siddiqui",
    email: "aisha.s@email.com",
    phone: "+92 345 1122334",
    status: "active",
    branchId: "branch-clifton",
    childrenNames: ["Zainab Siddiqui"],
    portalAccess: true,
    lastLogin: "2025-07-10",
    createdAt: "2023-09-01",
  },
  {
    id: "par-004",
    name: "Omar Siddiqui",
    email: "omar.s@email.com",
    phone: "+92 333 9876543",
    status: "pending",
    branchId: "branch-clifton",
    childrenNames: ["Zainab Siddiqui"],
    portalAccess: false,
    createdAt: "2025-06-20",
  },
  {
    id: "par-005",
    name: "Sara Ahmed",
    email: "sara.a@email.com",
    phone: "+92 322 9988776",
    status: "active",
    branchId: "branch-dha",
    childrenNames: ["Ayaan Malik"],
    portalAccess: true,
    lastLogin: "2025-07-08",
    createdAt: "2023-06-15",
  },
  {
    id: "par-006",
    name: "Hassan Malik",
    email: "hassan.m@email.com",
    phone: "+92 312 5566778",
    status: "inactive",
    branchId: "branch-dha",
    childrenNames: ["Ayaan Malik", "Ibrahim Qureshi"],
    portalAccess: false,
    lastLogin: "2025-03-02",
    createdAt: "2023-06-15",
  },
  {
    id: "par-007",
    name: "Maryam Ali",
    email: "maryam.a@email.com",
    phone: "+92 334 2233445",
    status: "active",
    branchId: "branch-gulshan",
    childrenNames: ["Sara Hussain"],
    portalAccess: true,
    lastLogin: "2025-07-13",
    createdAt: "2022-08-20",
  },
  {
    id: "par-008",
    name: "Zaid Hussain",
    email: "zaid.h@email.com",
    phone: "+92 301 4455667",
    status: "pending",
    branchId: "branch-gulshan",
    childrenNames: ["Sara Hussain", "Aisha Baig"],
    portalAccess: false,
    createdAt: "2025-07-01",
  },
  {
    id: "par-009",
    name: "Saima Noor",
    email: "saima.noor@email.com",
    phone: "+92 300 7788990",
    status: "active",
    branchId: "branch-clifton",
    childrenNames: ["Mariam Noor"],
    portalAccess: true,
    lastLogin: "2025-07-11",
    createdAt: "2025-06-17",
  },
  {
    id: "par-010",
    name: "Kamran Ahmed",
    email: "kamran.a@email.com",
    phone: "+92 321 5566778",
    status: "active",
    branchId: "branch-nn",
    childrenNames: ["Yusuf Ahmed"],
    portalAccess: true,
    lastLogin: "2025-07-09",
    createdAt: "2025-06-20",
  },
  {
    id: "par-011",
    name: "Nabeel Iqbal",
    email: "nabeel.i@email.com",
    phone: "+92 333 1122445",
    status: "inactive",
    branchId: "branch-nn",
    childrenNames: ["Rayyan Iqbal"],
    portalAccess: false,
    lastLogin: "2025-01-15",
    createdAt: "2025-06-19",
  },
  {
    id: "par-012",
    name: "Hina Tariq",
    email: "hina.parent@email.com",
    phone: "+92 345 6677889",
    status: "pending",
    branchId: "branch-dha",
    childrenNames: [],
    portalAccess: false,
    createdAt: "2025-07-14",
  },
];

/** Sample CSV template content for bulk parent import */
export const PARENT_CSV_TEMPLATE = `name,email,phone,branch,childName,relation,portalAccess
Fatima Khan,fatima.khan@email.com,+92 321 7654321,North Nazimabad Campus,Hamdan Khan,mother,yes
Ahmed Khan,ahmed.khan@email.com,+92 300 1234567,North Nazimabad Campus,Hamdan Khan,father,yes
Aisha Siddiqui,aisha.s@email.com,+92 345 1122334,Clifton Campus,Zainab Siddiqui,mother,yes
`;
