"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/security/Can";

export function StudentsPageActions() {
  return (
    <Can capability="admissions.update">
      <Button asChild>
        <Link href="/admissions/new">New Admission</Link>
      </Button>
    </Can>
  );
}
