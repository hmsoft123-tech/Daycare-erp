import { PageHeader } from "@/components/layout/PageHeader";
import { VideoHub } from "@/components/hr/VideoHub";
import { TrainingDashboard } from "@/components/hr/TrainingDashboard";
import { getTrainingVideos } from "@/lib/mock-service";
import {
  trainingAssignments,
  trainingCertificatesIssued,
} from "@/data/training-assignments";

export default async function TrainingPage() {
  const videos = await getTrainingVideos();

  return (
    <>
      <PageHeader
        title="Training & Induction"
        subtitle="Dashboard · expandable categories · onboarding · quiz · certificates · parent library"
      />
      <div className="space-y-10">
        <TrainingDashboard
          videos={videos}
          assignments={trainingAssignments}
          certificates={trainingCertificatesIssued}
        />
        <VideoHub videos={videos} />
      </div>
    </>
  );
}
