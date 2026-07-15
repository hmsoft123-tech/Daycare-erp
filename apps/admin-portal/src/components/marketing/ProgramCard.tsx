"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users } from "lucide-react";

interface ProgramCardProps {
  title: string;
  ageRange: string;
  schedule: string;
  capacity: string;
  description: string;
  highlight?: boolean;
}

export function ProgramCard({ title, ageRange, schedule, capacity, description, highlight }: ProgramCardProps) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className={highlight ? "border-brand-500 ring-2 ring-brand-100" : ""}>
        <CardContent className="p-6">
          {highlight && (
            <span className="mb-3 inline-block rounded-full bg-brand-100 px-3 py-0.5 text-xs font-medium text-brand-900">
              Most Popular
            </span>
          )}
          <h3 className="font-heading text-xl font-bold text-brand-900">{title}</h3>
          <p className="mt-1 text-sm text-brand-500">{ageRange}</p>
          <p className="mt-4 text-sm text-gray-600">{description}</p>
          <div className="mt-4 flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{schedule}</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{capacity}</span>
          </div>
          <Button asChild className="mt-6 w-full" variant={highlight ? "default" : "outline"}>
            <Link href="/contact">Enquire Now</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
