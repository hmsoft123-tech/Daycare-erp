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
    <Card>
      <CardHeader>
        <CardTitle>Recent Enrollments</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {filtered.slice(0, 8).map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {item.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.avatar} alt={item.studentName} className="h-full w-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-brand-100 text-brand-900 text-xs">
                    {getInitials(item.studentName)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{item.studentName}</p>
                <p className="text-xs text-gray-500">{formatDate(item.enrolledDate)}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                  statusPillStyles[item.status]
                )}
              >
                {item.status}
              </span>
            </li>
          ))}
        </ul>
        <Link href="/students" className="mt-4 block text-center text-sm font-medium text-brand-500 hover:underline">
          View all students
        </Link>
      </CardContent>
    </Card>
  );
}
