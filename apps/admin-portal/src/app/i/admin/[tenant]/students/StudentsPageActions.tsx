"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HasPermission } from "@/components/security/HasPermission";
import { Permission } from "@kinder-pilot/types";

export function StudentsPageActions() {
  return (
    <HasPermission name={Permission.StudentsWrite}>
      <Button asChild>
        <Link href="/admissions/new">New Admission</Link>
      </Button>
    </HasPermission>
  );
}
