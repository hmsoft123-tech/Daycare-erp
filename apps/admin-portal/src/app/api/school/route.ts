import { NextResponse } from "next/server";
import {
  createParentSchoolAssignment,
  createParentSchoolHomework,
  createParentSchoolNotice,
  createParentSchoolProgress,
  createParentSchoolSyllabus,
  getSchoolResource,
  saveDailyAttendance,
} from "@/lib/mock-service";
import type { SchoolResource } from "@/types";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const RESOURCES: SchoolResource[] = [
  "attendance",
  "homework",
  "assignments",
  "progress",
  "notices",
  "syllabus",
];

function isResource(v: string | null | undefined): v is SchoolResource {
  return !!v && (RESOURCES as string[]).includes(v);
}

/** Parent portal reads School modules here */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource");
  const studentId = searchParams.get("studentId") ?? undefined;

  if (!isResource(resource)) {
    return NextResponse.json(
      { error: "resource required", resources: RESOURCES },
      { status: 400, headers: CORS }
    );
  }

  const items = await getSchoolResource(resource, studentId);
  return NextResponse.json({ resource, items }, { headers: CORS });
}

export async function POST(request: Request) {
  const body = await request.json();
  const resource = body?.resource as string | undefined;
  const action = body?.action as string | undefined;

  if (action === "saveAttendance") {
    const saved = await saveDailyAttendance({
      date: body.date,
      classId: body.classId,
      marks: body.marks ?? [],
    });
    return NextResponse.json({ items: saved }, { status: 201, headers: CORS });
  }

  if (!isResource(resource) || resource === "attendance") {
    return NextResponse.json(
      { error: "Provide resource (homework|assignments|progress|notices|syllabus) or action=saveAttendance" },
      { status: 400, headers: CORS }
    );
  }

  const data = body.data ?? body;
  let item: unknown;

  switch (resource) {
    case "homework":
      item = await createParentSchoolHomework(data);
      break;
    case "assignments":
      item = await createParentSchoolAssignment(data);
      break;
    case "progress":
      item = await createParentSchoolProgress(data);
      break;
    case "notices":
      item = await createParentSchoolNotice(data);
      break;
    case "syllabus":
      item = await createParentSchoolSyllabus({
        ...data,
        topics: Array.isArray(data.topics)
          ? data.topics
          : String(data.topics ?? "")
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean),
      });
      break;
    default:
      return NextResponse.json({ error: "Unsupported resource" }, { status: 400, headers: CORS });
  }

  return NextResponse.json({ item }, { status: 201, headers: CORS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
