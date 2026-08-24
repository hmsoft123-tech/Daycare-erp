import Link from "next/link";
import {
  Baby,
  BookOpen,
  Calendar,
  CalendarCheck,
  ClipboardList,
  FileText,
  FolderOpen,
  FormInput,
  Library,
  Megaphone,
  MonitorPlay,
  NotebookPen,
  AlertTriangle,
} from "lucide-react";
import { SchoolPageHeader } from "@/components/school/SchoolPageHeader";

const modules = [
  { href: "/school/attendance", title: "Attendance", desc: "Daily / monthly history, late & absence %", icon: CalendarCheck, color: "bg-soft-green text-[#0E9F6E]" },
  { href: "/school/homework", title: "Homework", desc: "Tonight’s tasks and due dates", icon: NotebookPen, color: "bg-brand-50 text-brand-600" },
  { href: "/school/assignments", title: "Assignments", desc: "Projects, show & tell, graded work", icon: ClipboardList, color: "bg-soft-blue text-[#4C8BF5]" },
  { href: "/school/progress", title: "Progress report", desc: "Term remarks and developmental areas", icon: FileText, color: "bg-soft-yellow text-[#B76E00]" },
  { href: "/school/milestones", title: "Baby milestones", desc: "Tummy time → first steps tracker", icon: Baby, color: "bg-soft-blue text-[#4C8BF5]" },
  { href: "/school/virtual", title: "Virtual classroom", desc: "Meet / Zoom / Teams live sessions", icon: MonitorPlay, color: "bg-brand-50 text-brand-700" },
  { href: "/school/library", title: "Digital library", desc: "Issued books, due dates, history", icon: Library, color: "bg-soft-yellow text-[#B76E00]" },
  { href: "/school/incidents", title: "Incidents", desc: "ABC reports shared by school", icon: AlertTriangle, color: "bg-soft-red text-danger" },
  { href: "/school/notices", title: "Notices", desc: "School & class announcements", icon: Megaphone, color: "bg-soft-red text-danger" },
  { href: "/school/syllabus", title: "Syllabus", desc: "Weekly themes and learning units", icon: BookOpen, color: "bg-brand-50 text-brand-700" },
  { href: "/school/calendar", title: "School calendar", desc: "Holidays, events, PTMs, assessments", icon: Calendar, color: "bg-soft-yellow text-[#B76E00]" },
  { href: "/school/documents", title: "Documents", desc: "Enrollment, leaving, letters & reports", icon: FolderOpen, color: "bg-brand-50 text-brand-600" },
  { href: "/school/forms", title: "Forms", desc: "Feedback, complaint, service, consent, aid", icon: FormInput, color: "bg-soft-green text-[#0E9F6E]" },
];

export default function SchoolHubPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <SchoolPageHeader
        title="School"
        subtitle="Academic record, library, virtual class, incidents, forms & documents"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.href}
              href={m.href}
              className="flex gap-3 rounded-2xl bg-surface p-4 shadow-card transition hover:shadow-[0_8px_28px_rgba(31,41,51,0.1)]"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${m.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-heading">{m.title}</p>
                <p className="mt-0.5 text-xs text-muted">{m.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
