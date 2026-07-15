import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "secondary";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-brand-50 text-brand-700",
    success: "bg-soft-green text-brand-700",
    warning: "bg-soft-yellow text-[#B76E00]",
    danger: "bg-soft-red text-danger",
    info: "bg-soft-cyan text-[#006C9C]",
    secondary: "bg-bg text-muted",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
