"use client";

import { useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { mockChildren, mockFeed } from "@/data/mock";
import { cn } from "@kinder-pilot/ui";

export default function PhotosPage() {
  const [childId, setChildId] = useState("all");
  const photos = useMemo(
    () =>
      mockFeed.filter(
        (f) =>
          f.type === "photo" &&
          f.imageUrl &&
          (childId === "all" || f.childId === childId)
      ),
    [childId]
  );

  return (
    <div className="space-y-4">
      <section>
        <h1 className="font-heading text-xl font-bold text-heading">Photo gallery</h1>
        <p className="mt-1 text-sm text-muted">All moments shared by your program</p>
      </section>

      <div className="flex gap-2 overflow-x-auto">
        <button
          onClick={() => setChildId("all")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold",
            childId === "all" ? "bg-brand-500 text-white" : "bg-surface text-muted shadow-card"
          )}
        >
          All kids
        </button>
        {mockChildren.map((c) => (
          <button
            key={c.id}
            onClick={() => setChildId(c.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              childId === c.id ? "bg-brand-500 text-white" : "bg-surface text-muted shadow-card"
            )}
          >
            {c.name.split(" ")[0]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {photos.map((p) => (
          <article key={p.id} className="overflow-hidden rounded-2xl bg-surface shadow-card">
            <div className="aspect-square bg-bg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover" />
            </div>
            <div className="flex items-center justify-between gap-2 px-2.5 py-2">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-heading">{p.title}</p>
                <p className="text-[10px] text-muted">{p.childName}</p>
              </div>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-muted">
                <Heart className="h-3 w-3 fill-brand-500 text-brand-500" /> {p.likes ?? 0}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
