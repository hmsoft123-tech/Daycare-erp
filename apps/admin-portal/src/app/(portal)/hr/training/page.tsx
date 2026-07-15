import { PageHeader } from "@/components/layout/PageHeader";
import { VideoHub } from "@/components/hr/VideoHub";
import { getTrainingVideos } from "@/lib/mock-service";

export default async function TrainingPage() {
  const videos = await getTrainingVideos();

  return (
    <>
      <PageHeader title="Training Hub" subtitle="Staff development and compliance videos" />
      <VideoHub videos={videos} />
    </>
  );
}
