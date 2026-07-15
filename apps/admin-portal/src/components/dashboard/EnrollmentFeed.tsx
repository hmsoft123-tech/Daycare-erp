"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, getInitials, statusPillStyles, cn } from "@/lib/utils";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import type { EnrollmentFeedItem } from "@/types";

interface EnrollmentFeedProps {
  items: EnrollmentFeedItem[];
}

export function EnrollmentFeed({ items }: EnrollmentFeedProps) {
  const branchId = useBranchFilter();
  const filtered = branchId ? items.filter((i) => i.branchId === branchId) : items;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Enrollments</CardTitle>
        <Link href="/students" className="text-sm font-semibold text-brand-500 hover:text-brand-600">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {filtered.slice(0, 8).map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-bg"
            >
              <Avatar className="h-10 w-10">
                {item.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.avatar} alt={item.studentName} className="h-full w-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-brand-50 text-xs font-semibold text-brand-700">
                    {getInitials(item.studentName)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-heading">{item.studentName}</p>
                <p className="text-xs text-muted">{formatDate(item.enrolledDate)}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                  statusPillStyles[item.status]
                )}
              >
                {item.status}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
