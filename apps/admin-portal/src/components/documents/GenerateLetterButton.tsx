"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { LetterAudience, LetterKind } from "@/types/letters";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  audience: LetterAudience;
  subjectId: string;
  kind?: LetterKind;
  label?: string;
  className?: string;
};

/** Deep-link into Documents hub with subject + letter type preselected */
export function GenerateLetterButton({
  audience,
  subjectId,
  kind,
  label = "Letters & certificates",
  className,
}: Props) {
  const params = new URLSearchParams({ audience, subjectId });
  if (kind) params.set("kind", kind);

  return (
    <Button variant="outline" className={cn(className)} asChild>
      <Link href={`/documents?${params.toString()}`}>
        <FileText className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}
