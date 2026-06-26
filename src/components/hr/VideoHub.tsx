"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Clock } from "lucide-react";
import type { TrainingVideo } from "@/types";

interface VideoHubProps {
  videos: TrainingVideo[];
}

export function VideoHub({ videos }: VideoHubProps) {
  const featured = videos.filter((v) => v.featured);
  const rest = videos.filter((v) => !v.featured);

  return (
    <div className="space-y-8">
      {featured.length > 0 && (
        <section>
          <h3 className="mb-4 font-heading text-lg font-semibold">Featured</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {featured.map((video, i) => (
              <VideoCard key={video.id} video={video} index={i} large />
            ))}
          </div>
        </section>
      )}
      <section>
        <h3 className="mb-4 font-heading text-lg font-semibold">All Training Videos</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((video, i) => (
            <VideoCard key={video.id} video={video} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

function VideoCard({ video, index, large }: { video: TrainingVideo; index: number; large?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-md">
        <div className={`relative bg-brand-900 ${large ? "h-48" : "h-36"}`}>
          {video.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover opacity-80" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Play className="h-12 w-12 text-white/60" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
            <Play className="h-10 w-10 text-white" />
          </div>
          <Badge className="absolute right-2 top-2 capitalize">{video.category}</Badge>
        </div>
        <CardContent className="p-4">
          <p className="font-medium line-clamp-2">{video.title}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{video.duration}</span>
            <span>{video.progress}% complete</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${video.progress}%` }} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
