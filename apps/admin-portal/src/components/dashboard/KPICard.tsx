"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type IconTone = "green" | "blue" | "yellow" | "red" | "cyan";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  tone?: IconTone;
  className?: string;
}

const toneStyles: Record<IconTone, { wrap: string; icon: string }> = {
  green: { wrap: "bg-soft-green", icon: "text-brand-600" },
  blue: { wrap: "bg-soft-blue", icon: "text-info" },
  yellow: { wrap: "bg-soft-yellow", icon: "text-warning" },
  red: { wrap: "bg-soft-red", icon: "text-danger" },
  cyan: { wrap: "bg-soft-cyan", icon: "text-info" },
};

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  tone = "green",
  className,
}: KPICardProps) {
  const t = toneStyles[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className={cn("flex h-full flex-col shadow-card-hover", className)}>
        <CardContent className="flex h-full flex-col p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-muted">{title}</p>
              <p className="mt-3 font-heading text-[28px] font-bold leading-none tracking-tight text-heading">
                {value}
              </p>
              {/* Always reserve subtitle line so cards stay equal height */}
              <p className="mt-2 min-h-[16px] text-xs text-muted">{subtitle || "\u00A0"}</p>
            </div>
            <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", t.wrap)}>
              <Icon className={cn("h-7 w-7", t.icon)} />
            </div>
          </div>

          {/* Always reserve trend row */}
          <div className="mt-auto pt-3 min-h-[28px]">
            {trend ? (
              <div
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                  trend.value >= 0 ? "bg-soft-green text-brand-700" : "bg-soft-red text-danger"
                )}
              >
                {trend.value >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {trend.value >= 0 ? "+" : ""}
                {trend.value}%
                <span className="font-medium text-muted">{trend.label}</span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
