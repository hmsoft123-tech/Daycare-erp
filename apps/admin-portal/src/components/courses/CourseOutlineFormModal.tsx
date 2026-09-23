"use client";

import { useEffect, useState } from "react";
import { BookOpenCheck, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModalPortal } from "@/components/ui/modal-portal";
import { LastUpdated } from "@/components/common/LastUpdated";
import { ACADEMIC_SESSIONS, COURSE_PROGRAMS } from "@/data/course-outlines";
import { saveCourseOutline } from "@/lib/mock-service";
import { formatCurrency } from "@/lib/utils";
import type {
  CourseMaterialKind,
  CourseMaterialLine,
  CourseOutline,
  CourseStatus,
  InventoryItem,
  SyllabusUnit,
} from "@/types";

const selectClass = "mt-1 h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-heading";
const cellInput = "h-9 w-full rounded-lg border border-border bg-surface px-2 text-xs text-heading";

export const MATERIAL_KIND_LABEL: Record<CourseMaterialKind, string> = {
  book: "Book",
  copy: "Copy / notebook",
  workbook: "Workbook",
  material: "Course material / kit",
  stationery: "Stationery",
};

export const COURSE_STATUS_LABEL: Record<CourseStatus, string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

type Props = {
  open: boolean;
  course?: CourseOutline | null;
  items: InventoryItem[];
  onClose: () => void;
  onSaved: (c: CourseOutline) => void;
};

const uid = () => Math.random().toString(36).slice(2, 9);

export function CourseOutlineFormModal({ open, course, items, onClose, onSaved }: Props) {
  const [session, setSession] = useState<string>(ACADEMIC_SESSIONS[1]);
  const [classGroup, setClassGroup] = useState(COURSE_PROGRAMS[0].classGroup);
  const [title, setTitle] = useState("");
  const [outline, setOutline] = useState("");
  const [syllabus, setSyllabus] = useState<(SyllabusUnit & { topicsText: string })[]>([]);
  const [materials, setMaterials] = useState<CourseMaterialLine[]>([]);
  const [courseFee, setCourseFee] = useState("0");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [status, setStatus] = useState<CourseStatus>("draft");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Books, copies, kits and stationery can be linked for stock tracking
  const linkable = items.filter((i) => i.active && (i.itemType === "course_material" || i.category === "stationery"));

  useEffect(() => {
    if (!open) return;
    setSession(course?.academicSession ?? ACADEMIC_SESSIONS[1]);
    setClassGroup(course?.classGroup ?? COURSE_PROGRAMS[0].classGroup);
    setTitle(course?.title ?? "");
    setOutline(course?.outline ?? "");
    setSyllabus((course?.syllabus ?? []).map((u) => ({ ...u, topicsText: u.topics.join(", ") })));
    setMaterials(course?.materials.map((m) => ({ ...m })) ?? []);
    setCourseFee(String(course?.courseFee ?? 0));
    setEffectiveDate(course?.effectiveDate ?? "");
    setStatus(course?.status ?? "draft");
    setErrors({});
  }, [open, course]);

  const perStudent =
    Number(courseFee || 0) +
    materials.filter((m) => m.chargeToStudent).reduce((s, m) => s + m.qtyPerStudent * m.unitPrice, 0);

  const patchMaterial = (id: string, patch: Partial<CourseMaterialLine>) =>
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const submit = async () => {
    const next: Record<string, string> = {};
    if (title.trim().length < 3) next.title = "Course title required";
    if (!effectiveDate) next.effectiveDate = "Effective date required";
    if (Number.isNaN(Number(courseFee)) || Number(courseFee) < 0) next.courseFee = "Invalid fee";
    if (materials.some((m) => !m.name.trim() || m.qtyPerStudent < 0 || m.unitPrice < 0)) {
      next.materials = "Every material needs a name, quantity and price";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    const saved = await saveCourseOutline({
      id: course?.id,
      academicSession: session,
      classGroup,
      program: COURSE_PROGRAMS.find((p) => p.classGroup === classGroup)?.label ?? classGroup,
      title: title.trim(),
      outline: outline.trim(),
      syllabus: syllabus
        .filter((u) => u.subject.trim() || u.topicsText.trim())
        .map(({ topicsText, ...u }) => ({
          ...u,
          topics: topicsText.split(",").map((t) => t.trim()).filter(Boolean),
        })),
      materials: materials.map((m) => ({ ...m, name: m.name.trim() })),
      courseFee: Number(courseFee),
      effectiveDate,
      status,
    });
    onSaved({ ...saved, materials: [...saved.materials], syllabus: [...saved.syllabus] });
    toast.success(course ? "Course outline updated" : "Course outline created");
    onClose();
  };

  return (
    <ModalPortal open={open} onClose={onClose} maxWidth="max-w-4xl">
      <div className="flex shrink-0 items-start justify-between border-b border-border px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <BookOpenCheck className="h-5 w-5 text-brand-500" />
            {course ? "Edit course outline" : "New course outline"}
          </h2>
          {course ? (
            <LastUpdated stamp={course.lastUpdated} className="mt-1" />
          ) : (
            <p className="mt-1 text-sm text-muted">Syllabus, required books / copies and course fee for a class.</p>
          )}
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <Label>Academic session</Label>
            <select className={selectClass} value={session} onChange={(e) => setSession(e.target.value)}>
              {ACADEMIC_SESSIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Class / Program</Label>
            <select className={selectClass} value={classGroup} onChange={(e) => setClassGroup(e.target.value)}>
              {COURSE_PROGRAMS.map((p) => (
                <option key={p.classGroup} value={p.classGroup}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="ceff">Effective date</Label>
            <Input id="ceff" type="date" className="mt-1" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
            {errors.effectiveDate && <p className="mt-1 text-xs text-danger">{errors.effectiveDate}</p>}
          </div>
          <div>
            <Label>Status</Label>
            <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as CourseStatus)}>
              {(Object.keys(COURSE_STATUS_LABEL) as CourseStatus[]).map((s) => (
                <option key={s} value={s}>{COURSE_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <Label htmlFor="ctitle">Course title</Label>
            <Input id="ctitle" className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
            {errors.title && <p className="mt-1 text-xs text-danger">{errors.title}</p>}
          </div>
          <div>
            <Label htmlFor="cfee">Course fee (PKR)</Label>
            <Input id="cfee" type="number" min={0} className="mt-1" value={courseFee} onChange={(e) => setCourseFee(e.target.value)} />
            {errors.courseFee && <p className="mt-1 text-xs text-danger">{errors.courseFee}</p>}
          </div>
          <div className="sm:col-span-4">
            <Label htmlFor="coutline">Course outline</Label>
            <Textarea id="coutline" rows={3} className="mt-1" value={outline} onChange={(e) => setOutline(e.target.value)} placeholder="Overview, learning outcomes, assessment" />
          </div>
        </div>

        {/* Syllabus */}
        <div className="rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-heading">Syllabus</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSyllabus((p) => [...p, { id: uid(), period: "", subject: "", topics: [], topicsText: "" }])}
            >
              <Plus className="h-3.5 w-3.5" /> Add unit
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {syllabus.length === 0 && <p className="text-xs text-muted">No units yet.</p>}
            {syllabus.map((u) => (
              <div key={u.id} className="grid gap-2 sm:grid-cols-[150px_150px_1fr_36px]">
                <input className={cellInput} placeholder="Term / weeks" value={u.period} onChange={(e) => setSyllabus((p) => p.map((x) => (x.id === u.id ? { ...x, period: e.target.value } : x)))} />
                <input className={cellInput} placeholder="Subject" value={u.subject} onChange={(e) => setSyllabus((p) => p.map((x) => (x.id === u.id ? { ...x, subject: e.target.value } : x)))} />
                <input className={cellInput} placeholder="Topics, comma separated" value={u.topicsText} onChange={(e) => setSyllabus((p) => p.map((x) => (x.id === u.id ? { ...x, topicsText: e.target.value } : x)))} />
                <button type="button" className="rounded-lg text-muted hover:bg-bg hover:text-danger" onClick={() => setSyllabus((p) => p.filter((x) => x.id !== u.id))} aria-label="Remove unit">
                  <Trash2 className="mx-auto h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Materials */}
        <div className="rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-heading">Books / copies / course material required</p>
              <p className="text-[11px] text-muted">Link to a stock item to track branch inventory and shortfalls.</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setMaterials((p) => [...p, { id: uid(), name: "", kind: "book", qtyPerStudent: 1, unitPrice: 0, chargeToStudent: true }])
              }
            >
              <Plus className="h-3.5 w-3.5" /> Add material
            </Button>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-xs">
              <thead className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted">
                <tr>
                  <th className="pb-1.5 pr-2">Stock item</th>
                  <th className="pb-1.5 pr-2">Name</th>
                  <th className="pb-1.5 pr-2">Type</th>
                  <th className="pb-1.5 pr-2">Qty / student</th>
                  <th className="pb-1.5 pr-2">Unit price</th>
                  <th className="pb-1.5 pr-2">Charge</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => (
                  <tr key={m.id}>
                    <td className="py-1 pr-2">
                      <select
                        className={cellInput}
                        value={m.itemId ?? ""}
                        onChange={(e) => {
                          const item = items.find((i) => i.id === e.target.value);
                          patchMaterial(m.id, item ? { itemId: item.id, name: item.name, unitPrice: item.unitCost } : { itemId: undefined });
                        }}
                      >
                        <option value="">Not stocked</option>
                        {linkable.map((i) => (
                          <option key={i.id} value={i.id}>{i.sku} · {i.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1 pr-2">
                      <input className={cellInput} value={m.name} onChange={(e) => patchMaterial(m.id, { name: e.target.value })} />
                    </td>
                    <td className="py-1 pr-2">
                      <select className={cellInput} value={m.kind} onChange={(e) => patchMaterial(m.id, { kind: e.target.value as CourseMaterialKind })}>
                        {(Object.keys(MATERIAL_KIND_LABEL) as CourseMaterialKind[]).map((k) => (
                          <option key={k} value={k}>{MATERIAL_KIND_LABEL[k]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="w-24 py-1 pr-2">
                      <input type="number" min={0} className={cellInput} value={m.qtyPerStudent} onChange={(e) => patchMaterial(m.id, { qtyPerStudent: Number(e.target.value) })} />
                    </td>
                    <td className="w-28 py-1 pr-2">
                      <input type="number" min={0} className={cellInput} value={m.unitPrice} onChange={(e) => patchMaterial(m.id, { unitPrice: Number(e.target.value) })} />
                    </td>
                    <td className="py-1 pr-2">
                      <label className="inline-flex items-center gap-1.5 text-muted">
                        <input type="checkbox" checked={m.chargeToStudent} onChange={(e) => patchMaterial(m.id, { chargeToStudent: e.target.checked })} />
                        On voucher
                      </label>
                    </td>
                    <td className="py-1">
                      <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-bg hover:text-danger" onClick={() => setMaterials((p) => p.filter((x) => x.id !== m.id))} aria-label="Remove material">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {materials.length === 0 && <p className="text-xs text-muted">No materials yet.</p>}
            {errors.materials && <p className="mt-1 text-xs text-danger">{errors.materials}</p>}
          </div>
          <p className="mt-3 text-right text-sm text-muted">
            Voucher per student: <span className="font-semibold text-heading">{formatCurrency(perStudent)}</span>
          </p>
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-border px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" onClick={submit}>{course ? "Save changes" : "Create outline"}</Button>
      </div>
    </ModalPortal>
  );
}
