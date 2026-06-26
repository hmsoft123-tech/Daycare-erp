import { cn, statusPillStyles } from "@/lib/utils";

type StatusKey = keyof typeof statusPillStyles;

interface StatusPillProps {
  status: StatusKey;
  label?: string;
  className?: string;
}

export function StatusPill({ status, label, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        statusPillStyles[status],
        className
      )}
    >
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}
