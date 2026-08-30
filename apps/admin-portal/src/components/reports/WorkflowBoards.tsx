"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type StepStatus = "done" | "live" | "partial" | "planned";
type BoardStatus = "demo" | "partial" | "planned";

type WorkflowStep = {
  step: string;
  status: StepStatus;
  note?: string;
  href?: string;
};

type WorkflowBoard = {
  title: string;
  owner: string;
  boardStatus: BoardStatus;
  href: string;
  items: WorkflowStep[];
};

const workflows: WorkflowBoard[] = [
  {
    title: "Admission",
    owner: "Admissions + Finance",
    boardStatus: "demo",
    href: "/admissions",
    items: [
      { step: "Inquiry / lead capture", status: "done", note: "Board + public /inquiry", href: "/admissions" },
      { step: "Tour / visit scheduling", status: "done", note: "Schedule meeting modal" },
      { step: "Enrollment wizard", status: "done", note: "/admissions/new · invite /enroll/{token}", href: "/admissions/new" },
      { step: "Fee lock (when unpaid)", status: "done", note: "HO approval", href: "/billing/fee-locks" },
      { step: "Initial billing / challan", status: "done", href: "/billing" },
      { step: "Classroom assign → All Students", status: "live", href: "/students" },
    ],
  },
  {
    title: "Child Daily Care",
    owner: "Classroom / Teachers",
    boardStatus: "partial",
    href: "/attendance",
    items: [
      { step: "Student profile & authorized pickup", status: "done", href: "/students" },
      { step: "Check-in / on-site status", status: "done", href: "/attendance" },
      { step: "Daily care logs (feed / sleep / hygiene)", status: "partial", note: "Deepen care-log UX" },
      { step: "ABC incidents when needed", status: "live", href: "/incidents" },
      { step: "Therapy logs when needed", status: "done", href: "/therapy" },
      { step: "Authorized pickup → check-out", status: "partial", note: "Pickup verification polish" },
    ],
  },
  {
    title: "Academic Program",
    owner: "Academics / Branch head",
    boardStatus: "demo",
    href: "/academics",
    items: [
      { step: "Services & classes setup", status: "done", href: "/services" },
      { step: "Classroom roster & capacity", status: "done", href: "/classrooms" },
      { step: "Academics (plans / progress)", status: "done", href: "/academics" },
      { step: "Virtual classroom links", status: "live", note: "Meet / Zoom / Teams", href: "/academics/virtual" },
      { step: "Parent School sync", status: "live", note: "Homework, notices, syllabus" },
      { step: "PTM / Family communications", status: "done", href: "/communications" },
    ],
  },
  {
    title: "Billing & Accounts",
    owner: "Finance",
    boardStatus: "partial",
    href: "/billing",
    items: [
      { step: "Fee schedule / charge", status: "done", note: "Plans & services" },
      { step: "Generate challan / invoice", status: "done", note: "Bank Al Habib format", href: "/billing" },
      { step: "HO fee-lock (unpaid enrol)", status: "done", href: "/billing/fee-locks" },
      { step: "Parent online pay (demo)", status: "live", note: "JazzCash / card / bank" },
      { step: "Receipt & unlock portal", status: "live", note: "Parent Payments" },
      { step: "Overdue / revision letter", status: "done", href: "/documents" },
      { step: "GL · TB · P&L · Balance Sheet", status: "planned", note: "Phase 2 — Finance tabs" },
    ],
  },
  {
    title: "Purchasing",
    owner: "Inventory / Branch ops",
    boardStatus: "demo",
    href: "/inventory",
    items: [
      { step: "Catalogue items", status: "done", href: "/inventory/items" },
      { step: "Stock levels / adjust", status: "done", href: "/inventory/stock" },
      { step: "PR: pending → billed → paid", status: "done", href: "/inventory" },
      { step: "Dispatch → goods received", status: "done" },
      { step: "Supplier history & reporting", status: "done" },
      { step: "Library book issue / return", status: "live", note: "Separate from pantry stock", href: "/library" },
    ],
  },
  {
    title: "Maintenance",
    owner: "Facilities / Admin",
    boardStatus: "planned",
    href: "/settings",
    items: [
      { step: "Service request (Settings / Inventory)", status: "planned", note: "Phase 2" },
      { step: "Vendor visit scheduled", status: "planned" },
      { step: "Work · parts · cost · invoice", status: "planned" },
      { step: "Service history logged", status: "planned" },
      { step: "Next reminder + Dashboard alert", status: "planned", note: "Dashboard widget" },
    ],
  },
  {
    title: "HR",
    owner: "HR / Branch head",
    boardStatus: "demo",
    href: "/hr/inquiries",
    items: [
      { step: "Staff inquiry / vacancy", status: "done", note: "Public /inquiry?type=employment", href: "/hr/inquiries" },
      { step: "Hiring wizard + application invite", status: "done", note: "/apply/{token}", href: "/hr/hire" },
      { step: "Verification & documents", status: "done", href: "/hr/staff" },
      { step: "Directory · assignment · leave", status: "done", href: "/hr/leave" },
      { step: "Payroll extras + training", status: "live", note: "PF / loans / quiz certs", href: "/hr/payroll" },
      { step: "Exit · settlement · rejoin", status: "done", note: "Staff lifecycle actions" },
    ],
  },
];

function boardBadgeVariant(status: BoardStatus): "success" | "warning" | "secondary" {
  if (status === "demo") return "success";
  if (status === "partial") return "warning";
  return "secondary";
}

function stepBadgeVariant(status: StepStatus): "success" | "warning" | "secondary" | "info" {
  if (status === "live") return "success";
  if (status === "done") return "secondary";
  if (status === "partial") return "warning";
  return "info";
}

function Board({ board }: { board: WorkflowBoard }) {
  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex h-full flex-col space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{board.title}</p>
            <p className="text-[11px] text-muted">Owner: {board.owner}</p>
          </div>
          <Badge variant={boardBadgeVariant(board.boardStatus)} className="capitalize shrink-0">
            {board.boardStatus}
          </Badge>
        </div>
        <ol className="flex-1 space-y-2">
          {board.items.map((s, i) => (
            <li
              key={`${board.title}-${s.step}`}
              className="flex items-start justify-between gap-2 rounded-xl border border-[#F1F3F5] px-3 py-2"
            >
              <div className="min-w-0">
                {s.href ? (
                  <Link href={s.href} className="text-sm font-medium text-heading hover:text-brand-600 hover:underline">
                    {i + 1}. {s.step}
                  </Link>
                ) : (
                  <p className="text-sm font-medium">
                    {i + 1}. {s.step}
                  </p>
                )}
                {s.note && <p className="text-[11px] text-muted">{s.note}</p>}
              </div>
              <Badge variant={stepBadgeVariant(s.status)} className="capitalize shrink-0">
                {s.status}
              </Badge>
            </li>
          ))}
        </ol>
        <Link href={board.href} className="text-[12px] font-medium text-brand-600 hover:underline">
          Open module →
        </Link>
      </CardContent>
    </Card>
  );
}

export function WorkflowBoards() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Badge variant="success" className="capitalize">
            demo
          </Badge>
          usable in current build
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Badge variant="warning" className="capitalize">
            partial
          </Badge>
          primary screens exist
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Badge variant="secondary" className="capitalize">
            planned
          </Badge>
          SDLC Phase 2
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {workflows.map((board) => (
          <Board key={board.title} board={board} />
        ))}
      </div>
    </div>
  );
}
