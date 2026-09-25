import { NextResponse } from "next/server";
import { getTrainingVideos } from "@/lib/mock-service";
import { corsHeaders, preflight } from "@/lib/api-guard";
import type { TrainingAudience, TrainingTopic } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const audience = (searchParams.get("audience") as TrainingAudience | null) ?? undefined;
  const topic = (searchParams.get("topic") as TrainingTopic | null) ?? undefined;
  const videos = await getTrainingVideos({ audience, topic, activeOnly: true });
  return NextResponse.json({ videos }, { headers: corsHeaders(request, "GET, OPTIONS") });
}

export async function OPTIONS(request: Request) {
  return preflight(request, "GET, OPTIONS");
}
