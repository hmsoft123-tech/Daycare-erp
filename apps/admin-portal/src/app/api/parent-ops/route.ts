import { NextResponse } from "next/server";
import {
  abcIncidents,
  appNotifications,
  calendarEvents,
  libraryBooks,
  libraryLoans,
  mandatoryFormSubmissions,
  messageThreads,
  ptmSlots,
  virtualClasses,
  type AbcIncident,
  type AppNotification,
  type LibraryLoan,
  type MandatoryFormKind,
  type MandatoryFormSubmission,
  type MessageThread,
  type VirtualClass,
} from "@/data/extended-ops";
import { students, parents, classes } from "@/data/students";
import { branches } from "@/data/branches";
import { staff } from "@/data/staff";
import { milestoneRecords } from "@/data/milestones";
import type { CalendarEvent } from "@kinder-pilot/types";
import { safeExternalUrl } from "@kinder-pilot/api-client/security";
import { corsHeaders, preflight, readJsonObject } from "@/lib/api-guard";

function mapStudentToParentChild(s: (typeof students)[number]) {
  const branch = branches.find((b) => b.id === s.branchId);
  const room = classes.find((c) => c.id === s.classId);
  const teacher = room ? staff.find((t) => t.id === room.teacherId) : undefined;
  const mother = parents.find((p) => s.parentIds.includes(p.id) && p.relation === "mother");
  const father = parents.find((p) => s.parentIds.includes(p.id) && p.relation === "father");
  const age = Math.max(
    0,
    new Date().getFullYear() - new Date(s.dob).getFullYear()
  );
  const initials = `${s.firstName[0] ?? ""}${s.lastName[0] ?? ""}`.toUpperCase();
  const colors = ["#FF6A3D", "#4C8BF5", "#0E9F6E", "#B76E00", "#7C3AED"];
  const colorIdx = Math.abs(s.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length;

  return {
    id: s.id,
    name: `${s.firstName} ${s.lastName}`,
    className: s.className ?? room?.name ?? "Unassigned",
    branch: branch?.name ?? s.branchId,
    ageLabel: `${age} yrs`,
    status: "checked_in" as const,
    enrollmentStatus:
      s.status === "active" ? ("active" as const) : ("pending_first_payment" as const),
    photoColor: colors[colorIdx],
    initials,
    allergies: s.allergies ?? [],
    teacher: teacher?.name ?? "Teacher",
    grNumber: s.grNumber,
    dob: s.dob,
    program: s.feePlan,
    emergencyContact: mother
      ? `${mother.name} · ${mother.phone}`
      : father
        ? `${father.name} · ${father.phone}`
        : undefined,
    authorizedPickup: [mother?.name, father?.name].filter(Boolean) as string[],
    photoConsent: true,
    daycareTrack: Boolean(s.daycare?.track),
  };
}

export async function GET(request: Request) {
  const CORS = corsHeaders(request);
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource");
  const childId = searchParams.get("childId") ?? undefined;

  switch (resource) {
    case "messages":
      return NextResponse.json({ items: messageThreads }, { headers: CORS });
    case "ptm":
      return NextResponse.json({ items: ptmSlots }, { headers: CORS });
    case "notifications":
      return NextResponse.json(
        {
          items: appNotifications.filter(
            (n) => n.audience === "parent" || n.audience === "all"
          ),
        },
        { headers: CORS }
      );
    case "library":
      return NextResponse.json(
        {
          items: childId
            ? libraryLoans.filter((l) => l.childId === childId)
            : libraryLoans,
        },
        { headers: CORS }
      );
    case "virtual":
      return NextResponse.json(
        {
          items: childId
            ? virtualClasses.filter((v) => v.childIds.includes(childId))
            : virtualClasses,
        },
        { headers: CORS }
      );
    case "incidents":
      return NextResponse.json(
        {
          items: childId
            ? abcIncidents.filter((i) => i.studentId === childId)
            : abcIncidents.filter((i) => i.notifiedParent),
        },
        { headers: CORS }
      );
    case "calendar": {
      const audience = searchParams.get("audience") ?? undefined;
      const branchId = searchParams.get("branchId") ?? undefined;
      const items = calendarEvents.filter(
        (e) =>
          (!audience || e.audience === audience || e.audience === "all") &&
          (!branchId || !e.branchId || e.branchId === branchId)
      );
      return NextResponse.json({ items }, { headers: CORS });
    }
    case "milestones": {
      const items = childId
        ? milestoneRecords.filter((m) => m.studentId === childId)
        : milestoneRecords;
      return NextResponse.json({ items }, { headers: CORS });
    }
    case "mandatoryForms": {
      const items = childId
        ? mandatoryFormSubmissions.filter((f) => f.childId === childId)
        : mandatoryFormSubmissions;
      return NextResponse.json({ items }, { headers: CORS });
    }
    case "children": {
      const active = students.filter((s) => s.status === "active" || s.status === "alumni");
      // Demo parent family: Hamdan + Zainab (s1, s2) — matches parent login demo
      const family = active.filter((s) => s.id === "s1" || s.id === "s2");
      const items = (family.length ? family : active.slice(0, 2)).map(mapStudentToParentChild);
      return NextResponse.json({ items }, { headers: CORS });
    }
    default:
      return NextResponse.json(
        {
          error: "resource required",
          resources: [
            "messages",
            "ptm",
            "notifications",
            "library",
            "virtual",
            "incidents",
            "children",
            "calendar",
            "mandatoryForms",
            "milestones",
          ],
        },
        { status: 400, headers: CORS }
      );
  }
}

export async function POST(request: Request) {
  const CORS = corsHeaders(request);
  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: CORS });
  }
  const action = body.action as string | undefined;

  /** Parent books PTM */
  if (action === "bookPtm" && body.slotId) {
    const slot = ptmSlots.find((s) => s.id === body.slotId);
    if (slot && slot.status === "open") {
      slot.status = "booked";
      slot.parentName = body.parentName ?? "Parent";
      slot.childName = body.childName ?? "Child";
      return NextResponse.json({ item: slot }, { status: 201, headers: CORS });
    }
    return NextResponse.json({ error: "Slot unavailable" }, { status: 400, headers: CORS });
  }

  /** Parent or staff append message to thread */
  if (action === "sendMessage" && body.threadId && body.text) {
    const thread = messageThreads.find((t) => t.id === body.threadId);
    if (thread) {
      const from = body.from === "staff" ? ("staff" as const) : ("parent" as const);
      const msg = {
        id: `m-${Date.now()}`,
        from,
        body: String(body.text),
        at: new Date().toISOString(),
      };
      thread.messages.push(msg);
      thread.preview = msg.body;
      thread.updatedAt = msg.at;
      if (from === "parent") thread.unread = (thread.unread ?? 0) + 1;
      return NextResponse.json({ item: thread }, { status: 201, headers: CORS });
    }
    return NextResponse.json({ error: "Thread not found" }, { status: 404, headers: CORS });
  }

  /** Staff create new message thread (parent audience → parent portal) */
  if (action === "createThread") {
    const now = new Date().toISOString();
    const audience = body.audience === "staff" ? "staff" : "parent";
    const thread: MessageThread = {
      id: `mt-${Date.now()}`,
      audience,
      parentId: String(body.parentId ?? `new-${Date.now()}`),
      parentName: String(body.parentName ?? body.toName ?? "Parent"),
      withName: String(body.toName ?? body.parentName ?? "Parent"),
      withRole: audience === "parent" ? "parent" : "teacher",
      childId: body.childId,
      childName: body.childName,
      roomName: body.roomName,
      tags: audience === "parent" ? ["Parent"] : ["Staff"],
      preview: String(body.text ?? ""),
      updatedAt: now,
      unread: audience === "parent" ? 1 : 0,
      messages: [
        {
          id: `m-${Date.now()}`,
          from: "staff",
          body: String(body.text ?? ""),
          at: now,
        },
      ],
    };
    messageThreads.unshift(thread);
    return NextResponse.json({ item: thread }, { status: 201, headers: CORS });
  }

  /** Staff announcement / alert for parent notifications */
  if (action === "createNotification") {
    const note: AppNotification = {
      id: `n-${Date.now()}`,
      audience: body.audience === "staff" ? "staff" : body.audience === "all" ? "all" : "parent",
      title: String(body.title ?? "Notice"),
      body: String(body.body ?? ""),
      createdAt: new Date().toISOString(),
      type: (body.type as AppNotification["type"]) ?? "announcement",
      childId: body.childId,
    };
    appNotifications.unshift(note);
    return NextResponse.json({ item: note }, { status: 201, headers: CORS });
  }

  /** Staff book PTM slot */
  if (action === "staffBookPtm" && body.slotId) {
    const slot = ptmSlots.find((s) => s.id === body.slotId);
    if (slot) {
      slot.status = "booked";
      slot.parentName = body.parentName ?? "Walk-in parent";
      slot.childName = body.childName ?? "TBD";
      return NextResponse.json({ item: slot }, { status: 201, headers: CORS });
    }
    return NextResponse.json({ error: "Slot not found" }, { status: 404, headers: CORS });
  }

  /** ABC incident */
  if (action === "createIncident") {
    const student = students.find((s) => s.id === body.studentId);
    if (!student || !body.behavior) {
      return NextResponse.json(
        { error: "studentId and behavior required" },
        { status: 400, headers: CORS }
      );
    }
    const notify = Boolean(body.notifyParent);
    const row: AbcIncident = {
      id: `inc-${Date.now()}`,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      activityArea: String(body.activityArea || "Classroom"),
      antecedent: String(body.antecedent || "—"),
      behavior: String(body.behavior),
      consequence: String(body.consequence || "—"),
      firstResponder: String(body.firstResponder || "On-duty educator"),
      verifier: String(body.verifier || "Center Coordinator"),
      firstAid: body.firstAid ? String(body.firstAid) : undefined,
      minimizeIdeas: ["Review supervision ratios", "Document trigger"],
      branchId: student.branchId,
      notifiedParent: notify,
      status: notify ? "parent_notified" : "submitted",
    };
    abcIncidents.unshift(row);
    if (notify) {
      appNotifications.unshift({
        id: `n-inc-${Date.now()}`,
        audience: "parent",
        title: `Incident report — ${student.firstName}`,
        body: `ABC report filed for ${row.date}. Open School → Incidents for details.`,
        createdAt: new Date().toISOString(),
        type: "incident",
        childId: student.id,
      });
    }
    return NextResponse.json({ item: row }, { status: 201, headers: CORS });
  }

  /** Library issue */
  if (action === "issueLoan") {
    const book = libraryBooks.find((b) => b.id === body.bookId);
    const student = students.find((s) => s.id === body.studentId);
    if (!book || !student || book.available < 1) {
      return NextResponse.json({ error: "Book unavailable" }, { status: 400, headers: CORS });
    }
    const loan: LibraryLoan = {
      id: `l-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      childId: student.id,
      childName: student.firstName,
      issuedOn: new Date().toISOString().slice(0, 10),
      dueOn: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      status: "issued",
    };
    book.available -= 1;
    libraryLoans.unshift(loan);
    return NextResponse.json({ item: loan }, { status: 201, headers: CORS });
  }

  /** Library return */
  if (action === "returnLoan" && body.loanId) {
    const loan = libraryLoans.find((l) => l.id === body.loanId);
    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404, headers: CORS });
    }
    if (loan.status !== "returned") {
      loan.status = "returned";
      loan.returnedOn = new Date().toISOString().slice(0, 10);
      const book = libraryBooks.find((b) => b.id === loan.bookId);
      if (book) book.available = Math.min(book.copies, book.available + 1);
    }
    return NextResponse.json({ item: loan }, { headers: CORS });
  }

  /** Virtual class publish — live session or topic-wise recorded lesson */
  if (action === "createVirtualClass") {
    const sessionCategory: VirtualClass["sessionCategory"] =
      body.sessionCategory === "recorded" ? "recorded" : "live";
    // Only http(s) links reach parents — blocks javascript:/data: payloads.
    const joinUrl = safeExternalUrl(body.joinUrl);
    const recordingUrl = safeExternalUrl(body.recordingUrl);
    if ((body.joinUrl && !joinUrl) || (body.recordingUrl && !recordingUrl)) {
      return NextResponse.json(
        { error: "Links must be valid http(s) URLs" },
        { status: 400, headers: CORS }
      );
    }
    const row: VirtualClass = {
      id: `vc-${Date.now()}`,
      title: String(body.title ?? "Virtual class"),
      className: String(body.className ?? "Class"),
      teacherName: String(body.teacherName ?? "Staff"),
      provider: (body.provider as VirtualClass["provider"]) ?? "meet",
      joinUrl: joinUrl ?? "#",
      startsAt: body.startsAt
        ? String(body.startsAt)
        : new Date(Date.now() + 3600000).toISOString(),
      durationMin: Number(body.durationMin ?? 30),
      childIds: Array.isArray(body.childIds) ? body.childIds : ["s1", "s2"],
      status: sessionCategory === "recorded" ? "ended" : "upcoming",
      sessionCategory,
      recordingUrl,
      topic: body.topic ? String(body.topic) : undefined,
    };
    virtualClasses.unshift(row);
    return NextResponse.json({ item: row }, { status: 201, headers: CORS });
  }

  /** Parent submits a mandatory post-admission form */
  if (action === "submitMandatoryForm" && body.childId && body.kind) {
    const kind = body.kind as MandatoryFormKind;
    const values = (body.values && typeof body.values === "object" ? body.values : {}) as Record<
      string,
      string
    >;
    const idx = mandatoryFormSubmissions.findIndex(
      (f) => f.childId === body.childId && f.kind === kind
    );
    const submittedAt = new Date().toISOString();
    let item: MandatoryFormSubmission;
    if (idx >= 0) {
      mandatoryFormSubmissions[idx] = {
        ...mandatoryFormSubmissions[idx],
        status: "submitted",
        values,
        submittedAt,
      };
      item = mandatoryFormSubmissions[idx];
    } else {
      item = {
        id: `mf-${body.childId}-${kind}`,
        childId: String(body.childId),
        kind,
        status: "submitted",
        values,
        submittedAt,
      };
      mandatoryFormSubmissions.push(item);
    }
    return NextResponse.json({ item }, { status: 201, headers: CORS });
  }

  /** Staff create a calendar event (comms hub / annual planner) */
  if (action === "createCalendarEvent") {
    if (!body.title || !body.date) {
      return NextResponse.json({ error: "title and date required" }, { status: 400, headers: CORS });
    }
    const event: CalendarEvent = {
      id: `cal-${Date.now()}`,
      title: String(body.title),
      date: String(body.date),
      type: (body.type as CalendarEvent["type"]) ?? "event",
      audience: body.audience === "staff" ? "staff" : body.audience === "all" ? "all" : "parent",
      branchId: body.branchId ? String(body.branchId) : undefined,
      description: body.description ? String(body.description) : undefined,
      createdAt: new Date().toISOString(),
    };
    calendarEvents.unshift(event);
    return NextResponse.json({ item: event }, { status: 201, headers: CORS });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400, headers: CORS });
}

export async function OPTIONS(request: Request) {
  return preflight(request);
}
