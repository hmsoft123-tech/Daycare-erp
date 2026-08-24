import { NextResponse } from "next/server";
import {
  abcIncidents,
  appNotifications,
  libraryLoans,
  messageThreads,
  ptmSlots,
  virtualClasses,
} from "@/data/extended-ops";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(request: Request) {
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
    default:
      return NextResponse.json(
        {
          error: "resource required",
          resources: ["messages", "ptm", "notifications", "library", "virtual", "incidents"],
        },
        { status: 400, headers: CORS }
      );
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  if (body?.action === "bookPtm" && body.slotId) {
    const slot = ptmSlots.find((s) => s.id === body.slotId);
    if (slot && slot.status === "open") {
      slot.status = "booked";
      slot.parentName = body.parentName ?? "Parent";
      slot.childName = body.childName ?? "Child";
      return NextResponse.json({ item: slot }, { status: 201, headers: CORS });
    }
    return NextResponse.json({ error: "Slot unavailable" }, { status: 400, headers: CORS });
  }
  if (body?.action === "sendMessage" && body.threadId && body.text) {
    const thread = messageThreads.find((t) => t.id === body.threadId);
    if (thread) {
      const msg = {
        id: `m-${Date.now()}`,
        from: "parent" as const,
        body: String(body.text),
        at: new Date().toISOString(),
      };
      thread.messages.push(msg);
      thread.preview = msg.body;
      thread.updatedAt = msg.at;
      return NextResponse.json({ item: thread }, { status: 201, headers: CORS });
    }
  }
  return NextResponse.json({ error: "Unsupported action" }, { status: 400, headers: CORS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
