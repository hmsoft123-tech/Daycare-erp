import { NextResponse } from "next/server";
import {
  createClassroomActivity,
  getClassroomActivities,
} from "@/lib/mock-service";
import { corsHeaders, preflight, readJsonObject } from "@/lib/api-guard";

/** Parent portal + integrations read teacher logs here */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId") ?? undefined;
  const classId = searchParams.get("classId") ?? undefined;
  const branchId = searchParams.get("branchId") ?? undefined;
  const parentsOnly = searchParams.get("parentsOnly") !== "0";

  const activities = await getClassroomActivities({
    studentId,
    classId,
    branchId,
    parentsOnly,
  });

  return NextResponse.json({ activities }, { headers: corsHeaders(request) });
}

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: corsHeaders(request) });
  }
  const activity = await createClassroomActivity(body as Parameters<typeof createClassroomActivity>[0]);
  return NextResponse.json({ activity }, {
    status: 201,
    headers: corsHeaders(request),
  });
}

export async function OPTIONS(request: Request) {
  return preflight(request);
}
