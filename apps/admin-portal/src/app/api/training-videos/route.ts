import { NextResponse } from "next/server";
import { getTrainingVideos } from "@/lib/mock-service";
import type { TrainingAudience, TrainingTopic } from "@/types";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const audience = (searchParams.get("audience") as TrainingAudience | null) ?? undefined;
  const topic = (searchParams.get("topic") as TrainingTopic | null) ?? undefined;
  const videos = await getTrainingVideos({ audience, topic, activeOnly: true });
  return NextResponse.json({ videos }, { headers: cors });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}
