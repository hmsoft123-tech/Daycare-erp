"use client";

import Link from "next/link";
import { galleryItems } from "@/data/sdlc-parent";

export default function GalleryPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <section>
        <h1 className="font-heading text-xl font-bold text-heading md:text-2xl">Gallery</h1>
        <p className="mt-1 text-sm text-muted">
          Shared classroom photos · separate from developmental Portfolio
        </p>
      </section>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {galleryItems.map((g) => (
          <li key={g.id} className="overflow-hidden rounded-2xl bg-surface shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.imageUrl} alt={g.caption} className="aspect-[4/3] w-full object-cover" />
            <div className="p-3">
              <p className="text-sm font-bold text-heading">{g.caption}</p>
              <p className="text-[11px] text-muted">
                {g.childName} · {g.time}
              </p>
              <Link href={`/children/${g.childId}?tab=portfolio`} className="mt-2 inline-block text-xs font-bold text-brand-600">
                Open portfolio (learning evidence) →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
