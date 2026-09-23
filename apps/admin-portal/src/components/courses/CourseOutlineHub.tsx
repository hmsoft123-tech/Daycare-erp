"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BookOpen, FileText, PackageCheck, Pencil, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LastUpdated } from "@/components/common/LastUpdated";
import { FilterInput, FilterSelect } from "@/components/common/FilterControls";
import { PaymentVoucherModal, type PaymentVoucherData } from "@/components/billing/PaymentVoucher";
import {
  COURSE_STATUS_LABEL,
  CourseOutlineFormModal,
  MATERIAL_KIND_LABEL,
} from "@/components/courses/CourseOutlineFormModal";
import { branches } from "@/data/branches";
import { ACADEMIC_SESSIONS, COURSE_PROGRAMS } from "@/data/course-outlines";
import {
  createCourseVouchers,
  createPurchaseRequisition,
  issueCourseMaterials,
  markCourseVoucherPaid,
} from "@/lib/mock-service";
import { defaultForMonth } from "@/lib/procurement";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type {
  CourseOutline,
  CourseStatus,
  CourseVoucher,
  InventoryItem,
  Parent,
  StockLevel,
  Student,
} from "@/types";

const STATUS_BADGE: Record<CourseStatus, "success" | "secondary" | "default"> = {
  active: "success",
  draft: "secondary",
  archived: "default",
};

const branchName = (id: string) => branches.find((b) => b.id === id)?.name.replace(" Campus", "") ?? id;

type Props = {
  courses: CourseOutline[];
  vouchers: CourseVoucher[];
  students: Student[];
  parents: Parent[];
  classes: { id: string; classGroup?: string }[];
  items: InventoryItem[];
  stock: StockLevel[];
};

export function CourseOutlineHub({ courses: initialCourses, vouchers: initialVouchers, students, parents, classes, items, stock: initialStock }: Props) {
  const [courses, setCourses] = useState(initialCourses);
  const [vouchers, setVouchers] = useState(initialVouchers);
  const [stock, setStock] = useState(initialStock);
  const [session, setSession] = useState<string>("all");
  const [program, setProgram] = useState<string>("all");
  const [status, setStatus] = useState<CourseStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(initialCourses[0]?.id ?? "");
  const [branch, setBranch] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CourseOutline | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [voucherView, setVoucherView] = useState<PaymentVoucherData | null>(null);

  const itemMap = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);
  const classGroupOf = (s: Student) => classes.find((c) => c.id === s.classId)?.classGroup;

  const visible = courses.filter((c) => {
    if (session !== "all" && c.academicSession !== session) return false;
    if (program !== "all" && c.classGroup !== program) return false;
    if (status !== "all" && c.status !== status) return false;
    const q = search.trim().toLowerCase();
    return !q || c.title.toLowerCase().includes(q) || c.program.toLowerCase().includes(q);
  });
  const course = courses.find((c) => c.id === selectedId) ?? visible[0];

  // Active students in this class group (optionally one branch)
  const classStudents = useMemo(
    () =>
      course
        ? students.filter(
            (s) =>
              (s.status === "active" || s.status === "pending_first_payment") &&
              classGroupOf(s) === course.classGroup &&
              (branch === "all" || s.branchId === branch)
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [course, students, branch]
  );
  const courseVouchers = course ? vouchers.filter((v) => v.courseId === course.id) : [];
  const voucherFor = (studentId: string) => courseVouchers.find((v) => v.studentId === studentId && v.status !== "cancelled");

  const perStudentTotal = course
    ? course.courseFee + course.materials.filter((m) => m.chargeToStudent).reduce((s, m) => s + m.qtyPerStudent * m.unitPrice, 0)
    : 0;

  /** Materials still to hand out = students without materials issued, grouped per branch */
  const requirement = useMemo(() => {
    if (!course) return [];
    const pending = classStudents.filter((s) => !voucherFor(s.id)?.materialsIssued);
    const byBranch = new Map<string, number>();
    for (const s of pending) byBranch.set(s.branchId, (byBranch.get(s.branchId) ?? 0) + 1);
    return course.materials.flatMap((m) =>
      Array.from(byBranch.entries()).map(([branchId, count]) => {
        const required = m.qtyPerStudent * count;
        const onHand = m.itemId ? stock.find((l) => l.itemId === m.itemId && l.branchId === branchId)?.qtyOnHand ?? 0 : undefined;
        const shortfall = onHand === undefined ? 0 : Math.max(0, required - onHand);
        return { material: m, branchId, students: count, required, onHand, shortfall };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, classStudents, stock, vouchers]);

  const shortfalls = requirement.filter((r) => r.shortfall > 0);

  const raisePr = async () => {
    const byBranch = new Map<string, typeof shortfalls>();
    for (const r of shortfalls) byBranch.set(r.branchId, [...(byBranch.get(r.branchId) ?? []), r]);
    for (const [branchId, lines] of byBranch) {
      await createPurchaseRequisition({
        branchId,
        requestedBy: "Academics (Course Outline)",
        kind: "books",
        forMonth: defaultForMonth(),
        summary: `Course material shortfall — ${course!.title}`,
        items: lines.map((r, i) => ({
          id: `pri-${Date.now()}-${i}`,
          itemId: r.material.itemId,
          item: r.material.name,
          qty: r.shortfall,
          unitPrice: itemMap[r.material.itemId ?? ""]?.unitCost ?? r.material.unitPrice,
          remarks: `${r.students} student(s) × ${r.material.qtyPerStudent}`,
        })),
      });
    }
    toast.success(`Purchase requisition raised for ${byBranch.size} branch(es) under Course Material / Books`);
  };

  const generate = async () => {
    if (!course || picked.size === 0) return;
    const { created, skipped } = await createCourseVouchers({ courseId: course.id, studentIds: Array.from(picked) });
    setVouchers((prev) => [...created.map((v) => ({ ...v })), ...prev]);
    setPicked(new Set());
    toast.success(`${created.length} voucher(s) generated${skipped ? ` · ${skipped} skipped (already issued)` : ""}`);
  };

  const refreshVoucher = (v: CourseVoucher) => setVouchers((prev) => prev.map((x) => (x.id === v.id ? { ...v } : x)));

  const showVoucher = (v: CourseVoucher) => {
    const s = students.find((x) => x.id === v.studentId);
    if (!s || !course) return;
    const father = s.parentIds.map((id) => parents.find((p) => p.id === id)).find((p) => p?.relation === "father");
    const primary = father ?? parents.find((p) => s.parentIds.includes(p.id));
    setVoucherView({
      title: "Course & Books Voucher",
      voucherNumber: v.voucherNumber,
      issueDate: v.issuedAt,
      dueDate: v.dueDate,
      branchName: branches.find((b) => b.id === v.branchId)?.name ?? v.branchId,
      payer: {
        name: `${s.firstName} ${s.lastName}`,
        idLabel: "G.R. No.",
        idValue: s.grNumber ?? "—",
        parentName: primary?.name ?? "—",
        contact: primary?.phone ?? "—",
        context: `${course.program} · ${course.academicSession}`,
      },
      lines: v.lines,
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5">
        <FilterSelect label="Academic session" value={session} onChange={setSession} options={ACADEMIC_SESSIONS.map((s) => ({ value: s, label: s }))} />
        <FilterSelect label="Class / Program" value={program} onChange={setProgram} options={COURSE_PROGRAMS.map((p) => ({ value: p.classGroup, label: p.label }))} />
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={(Object.keys(COURSE_STATUS_LABEL) as CourseStatus[]).map((s) => ({ value: s, label: COURSE_STATUS_LABEL[s] }))}
        />
        <FilterInput label="Search" placeholder="Course title" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex items-end">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New course outline
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          {visible.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">No course outlines match.</p>
          )}
          {visible.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setSelectedId(c.id);
                setPicked(new Set());
              }}
              className={cn(
                "w-full rounded-2xl border bg-surface p-3.5 text-left transition hover:border-brand-300",
                course?.id === c.id ? "border-brand-400 ring-1 ring-brand-200" : "border-border"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-heading">{c.title}</p>
                <Badge variant={STATUS_BADGE[c.status]}>{COURSE_STATUS_LABEL[c.status]}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted">
                {c.program} · {c.academicSession}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                Fee {formatCurrency(c.courseFee)} · {c.materials.length} material(s) · from {formatDate(c.effectiveDate)}
              </p>
            </button>
          ))}
        </div>

        {course ? (
          <div className="min-w-0 space-y-4">
            <Card>
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                      {course.program} · Session {course.academicSession}
                    </p>
                    <h2 className="font-heading text-xl font-bold text-heading">{course.title}</h2>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(course);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-4">
                  <Info label="Course fee" value={formatCurrency(course.courseFee)} />
                  <Info label="Voucher / student" value={formatCurrency(perStudentTotal)} />
                  <Info label="Effective date" value={formatDate(course.effectiveDate)} />
                  <Info label="Status" value={COURSE_STATUS_LABEL[course.status]} />
                </div>
                <LastUpdated stamp={course.lastUpdated} />
              </CardContent>
            </Card>

            <Tabs defaultValue="outline">
              <TabsList className="flex h-auto flex-wrap">
                <TabsTrigger value="outline">Outline & syllabus</TabsTrigger>
                <TabsTrigger value="materials">Books & inventory</TabsTrigger>
                <TabsTrigger value="vouchers">Vouchers</TabsTrigger>
              </TabsList>

              <TabsContent value="outline" className="mt-4 space-y-4">
                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm font-semibold text-heading">Course outline</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-muted">{course.outline || "—"}</p>
                  </CardContent>
                </Card>
                <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="border-b border-border bg-bg">
                      <tr>
                        {["Period", "Subject", "Topics"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {course.syllabus.map((u) => (
                        <tr key={u.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3 text-muted">{u.period}</td>
                          <td className="px-4 py-3 font-medium text-heading">{u.subject}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {u.topics.map((t) => (
                                <span key={t} className="rounded-full bg-bg px-2 py-0.5 text-xs text-heading">{t}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {course.syllabus.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-sm text-muted">No syllabus units yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="materials" className="mt-4 space-y-4">
                <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead className="border-b border-border bg-bg">
                      <tr>
                        {["Material", "Type", "Stock item", "Qty / student", "Unit price", "Per student", "On voucher"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {course.materials.map((m) => (
                        <tr key={m.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3 font-medium text-heading">{m.name}</td>
                          <td className="px-4 py-3 text-muted">{MATERIAL_KIND_LABEL[m.kind]}</td>
                          <td className="px-4 py-3 font-mono text-xs text-muted">{m.itemId ? itemMap[m.itemId]?.sku ?? "—" : "Not stocked"}</td>
                          <td className="px-4 py-3">{m.qtyPerStudent}</td>
                          <td className="px-4 py-3">{formatCurrency(m.unitPrice)}</td>
                          <td className="px-4 py-3">{formatCurrency(m.qtyPerStudent * m.unitPrice)}</td>
                          <td className="px-4 py-3">{m.chargeToStudent ? "Yes" : <span className="text-muted">School cost</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Card>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-heading">Inventory requirement</p>
                        <p className="text-xs text-muted">
                          Students in {course.program} who have not yet received materials × quantity per student, against branch stock.
                        </p>
                      </div>
                      <div className="flex items-end gap-2">
                        <FilterSelect
                          label="Branch"
                          value={branch}
                          onChange={setBranch}
                          allLabel="All branches"
                          options={branches.map((b) => ({ value: b.id, label: branchName(b.id) }))}
                          className="w-44"
                        />
                        <Button type="button" size="sm" disabled={shortfalls.length === 0} onClick={raisePr}>
                          <ShoppingCart className="h-3.5 w-3.5" /> Raise PR for shortfall
                        </Button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-sm">
                        <thead className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted">
                          <tr>
                            {["Material", "Branch", "Students", "Required", "On hand", "Shortfall"].map((h) => (
                              <th key={h} className="px-3 py-2 text-left">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {requirement.map((r) => (
                            <tr key={`${r.material.id}-${r.branchId}`} className="border-b border-border last:border-0">
                              <td className="px-3 py-2 text-heading">{r.material.name}</td>
                              <td className="px-3 py-2 text-muted">{branchName(r.branchId)}</td>
                              <td className="px-3 py-2">{r.students}</td>
                              <td className="px-3 py-2">{r.required}</td>
                              <td className="px-3 py-2">{r.onHand ?? <span className="text-muted">Not stocked</span>}</td>
                              <td className="px-3 py-2">
                                {r.shortfall > 0 ? (
                                  <span className="inline-flex items-center gap-1 font-semibold text-danger">
                                    <AlertTriangle className="h-3.5 w-3.5" /> {r.shortfall}
                                  </span>
                                ) : (
                                  <span className="text-brand-700">OK</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {requirement.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-3 py-6 text-center text-sm text-muted">
                                No pending students in this class for the selected branch.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[11px] text-muted">
                      Stock is deducted when materials are issued from the Vouchers tab. See{" "}
                      <Link href="/inventory/stock" className="font-semibold text-brand-600">Branch Stock</Link> and{" "}
                      <Link href="/inventory" className="font-semibold text-brand-600">Procurement (PR)</Link>.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="vouchers" className="mt-4 space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <FilterSelect
                    label="Branch"
                    value={branch}
                    onChange={setBranch}
                    allLabel="All branches"
                    options={branches.map((b) => ({ value: b.id, label: branchName(b.id) }))}
                    className="w-48"
                  />
                  <Button type="button" disabled={picked.size === 0} onClick={generate}>
                    <FileText className="h-4 w-4" /> Generate vouchers ({picked.size})
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead className="border-b border-border bg-bg">
                      <tr>
                        <th className="w-10 px-3 py-3">
                          <input
                            type="checkbox"
                            aria-label="Select all without voucher"
                            checked={classStudents.filter((s) => !voucherFor(s.id)).length > 0 && classStudents.filter((s) => !voucherFor(s.id)).every((s) => picked.has(s.id))}
                            onChange={(e) =>
                              setPicked(e.target.checked ? new Set(classStudents.filter((s) => !voucherFor(s.id)).map((s) => s.id)) : new Set())
                            }
                          />
                        </th>
                        {["Student", "GR No.", "Branch", "Voucher", "Amount", "Status", "Materials", "Last updated", ""].map((h) => (
                          <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {classStudents.map((s) => {
                        const v = voucherFor(s.id);
                        return (
                          <tr key={s.id} className="border-b border-border last:border-0 hover:bg-bg">
                            <td className="px-3 py-3">
                              <input
                                type="checkbox"
                                disabled={!!v}
                                checked={picked.has(s.id)}
                                aria-label={`Select ${s.firstName}`}
                                onChange={(e) =>
                                  setPicked((prev) => {
                                    const next = new Set(prev);
                                    if (e.target.checked) next.add(s.id);
                                    else next.delete(s.id);
                                    return next;
                                  })
                                }
                              />
                            </td>
                            <td className="px-3 py-3 font-medium text-heading">{s.firstName} {s.lastName}</td>
                            <td className="px-3 py-3 font-mono text-xs">{s.grNumber ?? "—"}</td>
                            <td className="px-3 py-3 text-muted">{branchName(s.branchId)}</td>
                            <td className="px-3 py-3">
                              {v ? (
                                <button type="button" onClick={() => showVoucher(v)} className="font-mono text-xs font-semibold text-brand-600 hover:underline">
                                  {v.voucherNumber}
                                </button>
                              ) : (
                                <span className="text-xs text-muted">Not generated</span>
                              )}
                            </td>
                            <td className="px-3 py-3">{formatCurrency(v?.total ?? perStudentTotal)}</td>
                            <td className="px-3 py-3">
                              {v ? (
                                <Badge variant={v.status === "paid" ? "success" : v.status === "issued" ? "warning" : "secondary"}>
                                  {v.status === "issued" ? `Due ${formatDate(v.dueDate)}` : v.status}
                                </Badge>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-3 py-3">
                              {v?.materialsIssued ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                                  <PackageCheck className="h-3.5 w-3.5" /> Issued
                                </span>
                              ) : (
                                <span className="text-xs text-muted">Pending</span>
                              )}
                            </td>
                            <td className="px-3 py-3">{v ? <LastUpdated stamp={v.lastUpdated} variant="compact" /> : "—"}</td>
                            <td className="px-3 py-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                {v?.status === "issued" && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      const updated = await markCourseVoucherPaid(v.id);
                                      if (updated) {
                                        refreshVoucher(updated);
                                        toast.success(`${v.voucherNumber} marked paid`);
                                      }
                                    }}
                                  >
                                    Mark paid
                                  </Button>
                                )}
                                {v && !v.materialsIssued && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      const res = await issueCourseMaterials(v.id);
                                      if (!res.ok) {
                                        toast.error(res.error);
                                        return;
                                      }
                                      refreshVoucher(res.voucher);
                                      setStock((prev) => {
                                        const next = [...prev];
                                        for (const l of res.levels) {
                                          const i = next.findIndex((x) => x.id === l.id);
                                          if (i >= 0) next[i] = { ...l };
                                        }
                                        return next;
                                      });
                                      toast.success("Materials issued · branch stock updated");
                                    }}
                                  >
                                    <BookOpen className="h-3.5 w-3.5" /> Issue books
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {classStudents.length === 0 && (
                        <tr>
                          <td colSpan={10} className="px-3 py-8 text-center text-sm text-muted">
                            No active students in {course.program} for this branch.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <p className="text-sm text-muted">Create a course outline to get started.</p>
        )}
      </div>

      <CourseOutlineFormModal
        open={formOpen}
        course={editing}
        items={items}
        onClose={() => setFormOpen(false)}
        onSaved={(c) => {
          setCourses((prev) => (prev.some((x) => x.id === c.id) ? prev.map((x) => (x.id === c.id ? c : x)) : [c, ...prev]));
          setSelectedId(c.id);
        }}
      />
      <PaymentVoucherModal voucher={voucherView} onClose={() => setVoucherView(null)} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-bg px-3 py-2">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="font-semibold text-heading">{value}</p>
    </div>
  );
}
