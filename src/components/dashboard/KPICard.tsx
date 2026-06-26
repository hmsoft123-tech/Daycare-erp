"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  className?: string;
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, className }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{title}</p>
              <p className="mt-2 font-heading text-3xl font-bold text-brand-900">{value}</p>
              {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
              {trend && (
                <p className={cn("mt-2 text-xs font-medium", trend.value >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {trend.value >= 0 ? "+" : ""}
                  {trend.value}% {trend.label}
                </p>
              )}
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
              <Icon className="h-6 w-6 text-brand-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
