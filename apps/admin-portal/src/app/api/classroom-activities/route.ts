import { NextResponse } from "next/server";
import {
  createClassroomActivity,
  getClassroomActivities,
} from "@/lib/mock-service";

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

  return NextResponse.json({ activities }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const activity = await createClassroomActivity(body);
  return NextResponse.json({ activity }, {
    status: 201,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
